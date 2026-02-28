-- =====================================================
-- 添加几何图形存储列到 error_sessions 表
-- =====================================================

-- 添加 geometry_data 列（存储JSON数据，可编辑）
ALTER TABLE error_sessions
ADD COLUMN IF NOT EXISTS geometry_data JSONB DEFAULT NULL;

-- 添加 geometry_svg 列（存储SVG图片，视觉一致）
ALTER TABLE error_sessions
ADD COLUMN IF NOT EXISTS geometry_svg TEXT DEFAULT NULL;

-- 添加注释
COMMENT ON COLUMN error_sessions.geometry_data IS '几何图形的JSON数据，包含点、线、圆、角度等信息，可用于编辑';
COMMENT ON COLUMN error_sessions.geometry_svg IS '几何图形的SVG图片，用于显示，确保视觉一致性';

-- 创建索引以加速JSON查询
CREATE INDEX IF NOT EXISTS idx_error_sessions_geometry_data
ON error_sessions USING GIN (geometry_data)
WHERE geometry_data IS NOT NULL;
