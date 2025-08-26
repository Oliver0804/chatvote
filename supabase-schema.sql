-- ChatVote Supabase 數據庫架構
-- 這個文件包含創建所需表格的 SQL 語句

-- 創建投票表 (polls)
CREATE TABLE IF NOT EXISTS polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- 存儲選項陣列，例如: ["選項1", "選項2", "選項3"]
    votes JSONB DEFAULT '{}', -- 存儲投票結果，例如: {"選項1": 5, "選項2": 3}
    voter_ips TEXT[] DEFAULT '{}', -- 存儲已投票的IP地址
    duration_minutes INTEGER NOT NULL DEFAULT 5,
    created_by TEXT DEFAULT 'anonymous', -- 用戶ID
    user_type TEXT DEFAULT 'default', -- 用戶類型：default, premium, vip
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 創建索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at);
CREATE INDEX IF NOT EXISTS idx_polls_expires_at ON polls(expires_at);
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON polls(is_active);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_user_type ON polls(user_type);

-- 創建用於清理過期投票的函數
CREATE OR REPLACE FUNCTION cleanup_expired_polls()
RETURNS void AS $$
BEGIN
    -- 根據用戶類型和保存期限清理過期投票
    DELETE FROM polls 
    WHERE (
        -- VIP用戶：30天
        (user_type = 'vip' AND created_at < NOW() - INTERVAL '30 days') OR
        -- 高級用戶：14天  
        (user_type = 'premium' AND created_at < NOW() - INTERVAL '14 days') OR
        -- 默認用戶：7天
        (user_type = 'default' AND created_at < NOW() - INTERVAL '7 days')
    );
    
    -- 更新活躍狀態
    UPDATE polls 
    SET is_active = FALSE 
    WHERE expires_at < NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- 創建定時任務來自動清理過期投票（需要pg_cron擴展）
-- 註釋掉因為可能需要管理員權限
-- SELECT cron.schedule('cleanup-expired-polls', '0 2 * * *', 'SELECT cleanup_expired_polls();');

-- 創建RLS (Row Level Security) 政策
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- 允許所有人讀取投票
CREATE POLICY "Anyone can read polls" ON polls
    FOR SELECT USING (true);

-- 允許所有人創建投票
CREATE POLICY "Anyone can create polls" ON polls
    FOR INSERT WITH CHECK (true);

-- 允許所有人更新投票（用於投票和更新統計）
CREATE POLICY "Anyone can update polls" ON polls
    FOR UPDATE USING (true);

-- 只有服務角色可以刪除投票（用於清理）
CREATE POLICY "Only service role can delete polls" ON polls
    FOR DELETE USING (auth.role() = 'service_role');

-- 創建用於獲取活躍投票的視圖
CREATE OR REPLACE VIEW active_polls AS
SELECT 
    id,
    question,
    options,
    votes,
    duration_minutes,
    created_by,
    user_type,
    created_at,
    expires_at,
    (SELECT SUM((votes->>key)::integer) FROM jsonb_each_text(votes) AS key) as total_votes
FROM polls 
WHERE is_active = TRUE AND expires_at > NOW()
ORDER BY created_at DESC;

-- 創建用於獲取歷史投票的視圖
CREATE OR REPLACE VIEW history_polls AS
SELECT 
    id,
    question,
    options,
    votes,
    duration_minutes,
    created_by,
    user_type,
    created_at,
    expires_at,
    (SELECT SUM((votes->>key)::integer) FROM jsonb_each_text(votes) AS key) as total_votes
FROM polls 
WHERE is_active = FALSE OR expires_at <= NOW()
ORDER BY created_at DESC;