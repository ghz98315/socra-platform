-- =====================================================
-- Socra Platform - Family Management
-- 家庭管理系统
-- 创建时间: 2026-03-09
-- =====================================================

-- =====================================================
-- 1. 家庭组表
-- =====================================================
CREATE TABLE IF NOT EXISTS family_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  invite_code VARCHAR(20) UNIQUE,                    -- 家庭邀请码
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 緻加注释
COMMENT ON TABLE family_groups IS '家庭组表';
COMMENT ON COLUMN family_groups.invite_code IS '家庭邀请码，用于邀请成员加入';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_family_groups_invite_code ON family_groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_family_groups_created_by ON family_groups(created_by);

-- =====================================================
-- 2. 家庭成员表
-- =====================================================
CREATE TABLE IF NOT EXISTS family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'child',       -- 'parent', 'child'
  nickname VARCHAR(50),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(family_id, user_id)
);

-- 添加注释
COMMENT ON TABLE family_members IS '家庭成员表';
COMMENT ON COLUMN family_members.role IS '成员角色: parent 或 child';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);

-- =====================================================
-- 3. 家庭邀请记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS family_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitee_email VARCHAR(255),
  invitee_phone VARCHAR(20),
  invite_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',             -- 'pending', 'accepted', 'declined', 'expired'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 添加注释
COMMENT ON TABLE family_invitations IS '家庭邀请记录表';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_family_invitations_family ON family_invitations(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_code ON family_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_family_invitations_email ON family_invitations(invitee_email);

-- =====================================================
-- 4. RLS 策略
-- =====================================================

-- 启用 RLS
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

-- family_groups 策略
CREATE POLICY "Users can view their family groups" ON family_groups
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can manage their family groups" ON family_groups
  FOR ALL USING (auth.uid() = created_by);

-- family_members 策略
CREATE POLICY "Family members can view their family" ON family_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      JOIN family_groups fg ON fm.family_id = fg.id
      WHERE fm.user_id = auth.uid() OR fg.created_by = auth.uid()
    )
  );

CREATE POLICY "Family creators can manage members" ON family_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      JOIN family_groups fg ON fm.family_id = fg.id
      WHERE fg.created_by = auth.uid()
    )
  );

-- family_invitations 策略
CREATE POLICY "Family creators can manage invitations" ON family_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_invitations fi
      JOIN family_groups fg ON fi.family_id = fg.id
      WHERE fg.created_by = auth.uid()
    )
  );

-- =====================================================
-- 5. 触发器
-- =====================================================

-- 自动更新 updated_at
DROP TRIGGER IF EXISTS update_family_groups_updated_at ON family_groups;
CREATE TRIGGER update_family_groups_updated_at
  BEFORE UPDATE ON family_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_family_invitations_updated_at ON family_invitations;
CREATE TRIGGER update_family_invitations_updated_at
  BEFORE UPDATE ON family_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. 核心函数
-- =====================================================

-- 创建家庭组
CREATE OR REPLACE FUNCTION create_family_group(
  p_user_id UUID,
  p_family_name VARCHAR(100) DEFAULT '我的家庭'
)
RETURNS JSONB AS $$
DECLARE
  v_family_id UUID;
  v_invite_code VARCHAR(20);
BEGIN
  -- 生成唯一邀请码
  v_invite_code := upper(substring(md5(random()::text), 1, 8));

  -- 创建家庭组
  INSERT INTO family_groups (name, invite_code, created_by)
  VALUES (p_family_name, v_invite_code, p_user_id)
  RETURNING id INTO v_family_id;

  -- 添加创建者为家长
  INSERT INTO family_members (family_id, user_id, role)
  VALUES (v_family_id, p_user_id, 'parent');

  RETURN jsonb_build_object(
    'success', true,
    'family_id', v_family_id,
    'invite_code', v_invite_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 加入家庭组
CREATE OR REPLACE FUNCTION join_family_group(
  p_user_id UUID,
  p_invite_code VARCHAR(20)
)
RETURNS JSONB AS $$
DECLARE
  v_family_id UUID;
  v_family_name VARCHAR(100);
BEGIN
  -- 查找家庭组
  SELECT id, name INTO v_family_id, v_family_name
  FROM family_groups
  WHERE invite_code = p_invite_code;

  IF v_family_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '无效的邀请码'
    );
  END IF;

  -- 检查是否已是成员
  IF EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = v_family_id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '您已经是该家庭的成员'
    );
  END IF;

  -- 添加成员
  INSERT INTO family_members (family_id, user_id, role)
  VALUES (v_family_id, p_user_id, 'child');

  RETURN jsonb_build_object(
    'success', true,
    'family_id', v_family_id,
    'family_name', v_family_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取家庭成员
CREATE OR REPLACE FUNCTION get_family_members(p_family_id UUID)
RETURNS TABLE (
  user_id UUID,
  role VARCHAR(20),
  nickname VARCHAR(50),
  joined_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
    SELECT fm.user_id, fm.role, fm.nickname, fm.joined_at
    FROM family_members fm
    WHERE fm.family_id = p_family_id
    ORDER BY
      CASE WHEN fm.role = 'parent' THEN 0
      ELSE 1
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取用户的家庭
CREATE OR REPLACE FUNCTION get_user_families(p_user_id UUID)
RETURNS TABLE (
  family_id UUID,
  family_name VARCHAR(100),
  role VARCHAR(20),
  invite_code VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
    SELECT fg.id, fg.name, fm.role, fg.invite_code
    FROM family_members fm
    JOIN family_groups fg ON fm.family_id = fg.id
    WHERE fm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 完成
-- =====================================================
