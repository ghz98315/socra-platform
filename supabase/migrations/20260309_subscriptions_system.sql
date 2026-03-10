-- =====================================================
-- Socra Platform - Subscription System
-- 会员订阅系统
-- 创建时间: 2026-03-09
-- =====================================================

-- =====================================================
-- 1. 订阅计划配置表
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_code VARCHAR(50) UNIQUE NOT NULL,        -- 'free', 'monthly', 'quarterly', 'yearly'
  plan_name VARCHAR(100) NOT NULL,              -- '免费版', '月卡', '季卡', '年卡'
  price DECIMAL(10,2) NOT NULL DEFAULT 0,       -- 价格 (元)
  original_price DECIMAL(10,2),                 -- 原价 (用于显示折扣)
  duration_days INTEGER,                        -- 有效期天数 (NULL表示永久)
  is_popular BOOLEAN DEFAULT FALSE,             -- 是否为热门推荐
  sort_order INTEGER DEFAULT 0,                 -- 排序

  -- 权益配置
  features JSONB NOT NULL DEFAULT '{}',         -- 权益配置

  -- 状态
  is_active BOOLEAN DEFAULT TRUE,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_subscription_plans_code ON subscription_plans(plan_code);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- 注释
COMMENT ON TABLE subscription_plans IS '订阅计划配置表';
COMMENT ON COLUMN subscription_plans.plan_code IS '计划代码: free/monthly/quarterly/yearly';
COMMENT ON COLUMN subscription_plans.features IS '权益配置 JSON';

-- 初始化订阅计划
INSERT INTO subscription_plans (plan_code, plan_name, price, original_price, duration_days, is_popular, sort_order, features) VALUES
  ('free', '免费版', 0, NULL, NULL, FALSE, 1, '{
    "error_review_daily": 5,
    "ai_chat_rounds": 20,
    "essay_weekly": 3,
    "geometry_board": "basic",
    "review_plan": "basic",
    "time_planner": "basic",
    "learning_report": "basic",
    "history_days": 7,
    "pdf_export_monthly": 3,
    "priority_support": false
  }'),
  ('monthly', 'Pro 月卡', 29.00, NULL, 30, TRUE, 2, '{
    "error_review_daily": -1,
    "ai_chat_rounds": -1,
    "essay_weekly": -1,
    "geometry_board": "advanced",
    "review_plan": "ai_optimized",
    "time_planner": "ai_optimized",
    "learning_report": "detailed",
    "history_days": -1,
    "pdf_export_monthly": -1,
    "priority_support": true
  }'),
  ('quarterly', 'Pro 季卡', 79.00, 87.00, 90, FALSE, 3, '{
    "error_review_daily": -1,
    "ai_chat_rounds": -1,
    "essay_weekly": -1,
    "geometry_board": "advanced",
    "review_plan": "ai_optimized",
    "time_planner": "ai_optimized",
    "learning_report": "detailed",
    "history_days": -1,
    "pdf_export_monthly": -1,
    "priority_support": true,
    "bonus_points": 500
  }'),
  ('yearly', 'Pro 年卡', 249.00, 348.00, 365, FALSE, 4, '{
    "error_review_daily": -1,
    "ai_chat_rounds": -1,
    "essay_weekly": -1,
    "geometry_board": "advanced",
    "review_plan": "ai_optimized",
    "time_planner": "ai_optimized",
    "learning_report": "detailed",
    "history_days": -1,
    "pdf_export_monthly": -1,
    "priority_support": true,
    "bonus_points": 2000
  }')
ON CONFLICT (plan_code) DO NOTHING;

-- =====================================================
-- 2. 用户订阅表
-- =====================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 订阅信息
  plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
  plan_code VARCHAR(50) NOT NULL,

  -- 订阅状态
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 'active', 'expired', 'cancelled', 'refunded'

  -- 时间范围
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                        -- NULL表示永久
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,

  -- 支付信息
  payment_method VARCHAR(20),                    -- 'wechat', 'alipay', 'admin_grant'
  payment_id VARCHAR(255),                       -- 支付平台订单号
  paid_amount DECIMAL(10,2),                     -- 实付金额

  -- 优惠信息
  coupon_id UUID,
  coupon_code VARCHAR(50),
  discount_amount DECIMAL(10,2) DEFAULT 0,

  -- 自动续费
  auto_renew BOOLEAN DEFAULT FALSE,

  -- 元数据
  metadata JSONB DEFAULT '{}',

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires ON user_subscriptions(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_payment ON user_subscriptions(payment_id);

-- 注释
COMMENT ON TABLE user_subscriptions IS '用户订阅记录表';
COMMENT ON COLUMN user_subscriptions.status IS '订阅状态: active/expired/cancelled/refunded';
COMMENT ON COLUMN user_subscriptions.payment_method IS '支付方式: wechat/alipay/admin_grant';

-- =====================================================
-- 3. 优惠码表
-- =====================================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,              -- 优惠码
  name VARCHAR(200) NOT NULL,                    -- 优惠码名称

  -- 折扣类型
  discount_type VARCHAR(20) NOT NULL,            -- 'percentage', 'fixed', 'trial'
  discount_value DECIMAL(10,2) NOT NULL,         -- 折扣值 (百分比/固定金额/试用天数)

  -- 适用范围
  applicable_plans TEXT[] DEFAULT '{}',          -- 适用计划 (空数组表示全部)
  min_purchase DECIMAL(10,2) DEFAULT 0,          -- 最低消费

  -- 使用限制
  max_uses INTEGER DEFAULT 0,                    -- 最大使用次数 (0表示无限制)
  max_uses_per_user INTEGER DEFAULT 1,           -- 每用户最大使用次数
  current_uses INTEGER DEFAULT 0,                -- 当前使用次数

  -- 有效期
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,

  -- 状态
  is_active BOOLEAN DEFAULT TRUE,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

-- 注释
COMMENT ON TABLE coupons IS '优惠码配置表';
COMMENT ON COLUMN coupons.discount_type IS '折扣类型: percentage(百分比)/fixed(固定金额)/trial(试用)';
COMMENT ON COLUMN coupons.discount_value IS '折扣值: 百分比(如20表示8折)/固定金额/试用天数';

-- 初始化优惠码
INSERT INTO coupons (code, name, discount_type, discount_value, applicable_plans, max_uses, valid_from, valid_until) VALUES
  ('WELCOME2026', '新用户首月优惠', 'percentage', 50, ARRAY['monthly'], 10000, NOW(), '2026-12-31'),
  ('TRIAL7', '7天免费试用', 'trial', 7, ARRAY['monthly', 'quarterly', 'yearly'], 0, NOW(), '2026-12-31')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 4. 优惠码使用记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON coupon_usages(user_id);

-- =====================================================
-- 5. 支付订单表
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 订单信息
  order_no VARCHAR(100) UNIQUE NOT NULL,         -- 内部订单号
  out_trade_no VARCHAR(100),                     -- 外部交易号

  -- 订单内容
  plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
  plan_code VARCHAR(50) NOT NULL,
  plan_name VARCHAR(100) NOT NULL,

  -- 金额
  original_amount DECIMAL(10,2) NOT NULL,        -- 原价
  discount_amount DECIMAL(10,2) DEFAULT 0,       -- 优惠金额
  paid_amount DECIMAL(10,2) NOT NULL,            -- 实付金额

  -- 支付信息
  payment_method VARCHAR(20) NOT NULL,           -- 'wechat', 'alipay'
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'

  -- 优惠码
  coupon_id UUID REFERENCES coupons(id),
  coupon_code VARCHAR(50),

  -- 时间
  paid_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,                        -- 订单过期时间
  refunded_at TIMESTAMPTZ,

  -- 回调信息
  callback_data JSONB,                           -- 支付回调原始数据

  -- 元数据
  metadata JSONB DEFAULT '{}',

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_no ON payment_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_payment_orders_trade_no ON payment_orders(out_trade_no);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(payment_status);

-- 注释
COMMENT ON TABLE payment_orders IS '支付订单表';
COMMENT ON COLUMN payment_orders.payment_status IS '支付状态: pending/paid/failed/refunded';

-- =====================================================
-- 6. RLS 策略
-- =====================================================

-- 启用 RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- subscription_plans 策略 (所有人可读激活的计划)
CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT USING (is_active = TRUE);

-- user_subscriptions 策略
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- coupons 策略 (所有人可读有效的优惠码)
CREATE POLICY "Anyone can view valid coupons" ON coupons
  FOR SELECT USING (is_active = TRUE AND (valid_until IS NULL OR valid_until > NOW()));

-- coupon_usages 策略
CREATE POLICY "Users can view own coupon usages" ON coupon_usages
  FOR SELECT USING (auth.uid() = user_id);

-- payment_orders 策略
CREATE POLICY "Users can view own orders" ON payment_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON payment_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. 触发器
-- =====================================================

-- 更新时间戳函数 (如果不存在则创建)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 自动更新 updated_at
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_orders_updated_at ON payment_orders;
CREATE TRIGGER update_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. 核心函数
-- =====================================================

-- 获取用户当前订阅状态
CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'has_subscription', EXISTS (
      SELECT 1 FROM user_subscriptions
      WHERE user_id = p_user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
    ),
    'is_pro', EXISTS (
      SELECT 1 FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = p_user_id
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > NOW())
      AND sp.plan_code != 'free'
    ),
    'current_plan', (
      SELECT jsonb_build_object(
        'plan_code', sp.plan_code,
        'plan_name', sp.plan_name,
        'features', sp.features,
        'started_at', us.started_at,
        'expires_at', us.expires_at
      )
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = p_user_id
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > NOW())
      ORDER BY us.expires_at DESC NULLS LAST
      LIMIT 1
    ),
    'subscription_history', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'plan_name', sp.plan_name,
          'status', us.status,
          'started_at', us.started_at,
          'expires_at', us.expires_at
        )
      )
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = p_user_id
      ORDER BY us.created_at DESC
      LIMIT 5
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查用户是否有 Pro 权限
CREATE OR REPLACE FUNCTION is_pro_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_pro BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > NOW())
    AND sp.plan_code != 'free'
  ) INTO is_pro;

  RETURN is_pro;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查功能限制
CREATE OR REPLACE FUNCTION check_feature_limit(
  p_user_id UUID,
  p_feature VARCHAR(50),
  p_current_usage INTEGER
)
RETURNS JSONB AS $$
DECLARE
  feature_limit INTEGER;
  is_pro BOOLEAN;
BEGIN
  -- 检查是否为 Pro 用户
  SELECT is_pro_user(p_user_id) INTO is_pro;

  -- 获取功能限制
  SELECT (sp.features->>p_feature)::INTEGER INTO feature_limit
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
  AND us.status = 'active'
  AND (us.expires_at IS NULL OR us.expires_at > NOW())
  ORDER BY us.expires_at DESC NULLS LAST
  LIMIT 1;

  -- 如果没有订阅，使用免费计划限制
  IF feature_limit IS NULL THEN
    SELECT (features->>p_feature)::INTEGER INTO feature_limit
    FROM subscription_plans
    WHERE plan_code = 'free';
  END IF;

  -- -1 表示无限制
  IF feature_limit = -1 THEN
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'limit', -1,
      'current', p_current_usage,
      'remaining', -1,
      'is_pro', is_pro
    );
  END IF;

  -- 检查是否超限
  RETURN jsonb_build_object(
    'allowed', p_current_usage < feature_limit,
    'limit', feature_limit,
    'current', p_current_usage,
    'remaining', GREATEST(feature_limit - p_current_usage, 0),
    'is_pro', is_pro
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. 视图
-- =====================================================

-- 用户订阅概览视图
CREATE OR REPLACE VIEW user_subscription_overview AS
SELECT
  us.id,
  us.user_id,
  sp.plan_code,
  sp.plan_name,
  sp.price,
  us.status,
  us.started_at,
  us.expires_at,
  us.auto_renew,
  us.payment_method,
  CASE
    WHEN us.status = 'active' AND (us.expires_at IS NULL OR us.expires_at > NOW()) THEN TRUE
    ELSE FALSE
  END AS is_active,
  CASE
    WHEN us.expires_at IS NULL THEN NULL
    WHEN us.expires_at > NOW() THEN us.expires_at - NOW()
    ELSE INTERVAL '0'
  END AS remaining_time
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id;

COMMENT ON VIEW user_subscription_overview IS '用户订阅概览视图';

-- =====================================================
-- 完成
-- =====================================================
