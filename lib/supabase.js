// Supabase 配置和連接模塊
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 驗證環境變數
if (!process.env.SUPABASE_URL) {
    console.error('❌ 缺少 SUPABASE_URL 環境變數');
    process.exit(1);
}

if (!process.env.SUPABASE_ANON_KEY) {
    console.error('❌ 缺少 SUPABASE_ANON_KEY 環境變數');
    process.exit(1);
}

// 創建 Supabase 客戶端（用於用戶操作，遵守 RLS）
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// 創建 Supabase 管理員客戶端（用於管理操作，繞過 RLS）
let supabaseAdmin = null;
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
} else {
    console.warn('⚠️ 未設定 SUPABASE_SERVICE_ROLE_KEY，某些管理功能可能無法使用');
}

/**
 * 測試數據庫連接
 */
async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('polls')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Supabase 連接測試失敗:', error.message);
            return false;
        }
        
        console.log('✅ Supabase 連接成功');
        return true;
    } catch (err) {
        console.error('❌ Supabase 連接測試異常:', err.message);
        return false;
    }
}

/**
 * 創建新投票
 */
async function createPoll(pollData) {
    try {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + pollData.duration_minutes);
        
        const { data, error } = await supabase
            .from('polls')
            .insert([{
                question: pollData.question,
                options: pollData.options,
                votes: pollData.votes || {},
                voter_ips: [],
                duration_minutes: pollData.duration_minutes,
                created_by: pollData.created_by || 'anonymous',
                user_type: pollData.user_type || 'default',
                expires_at: expiresAt.toISOString(),
                is_active: true
            }])
            .select()
            .single();

        if (error) {
            console.error('創建投票失敗:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('創建投票異常:', err);
        return null;
    }
}

/**
 * 根據ID獲取投票
 */
async function getPoll(pollId) {
    try {
        const { data, error } = await supabase
            .from('polls')
            .select('*')
            .eq('id', pollId)
            .single();

        if (error) {
            console.error('獲取投票失敗:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('獲取投票異常:', err);
        return null;
    }
}

/**
 * 更新投票（添加票數和IP）
 */
async function updatePollVote(pollId, newVotes, voterIp) {
    try {
        // 首先獲取當前數據
        const currentPoll = await getPoll(pollId);
        if (!currentPoll) {
            return null;
        }

        // 檢查IP是否已投票
        if (currentPoll.voter_ips && currentPoll.voter_ips.includes(voterIp)) {
            throw new Error('該IP已經投過票了');
        }

        // 更新投票
        const { data, error } = await supabase
            .from('polls')
            .update({
                votes: newVotes,
                voter_ips: [...(currentPoll.voter_ips || []), voterIp]
            })
            .eq('id', pollId)
            .select()
            .single();

        if (error) {
            console.error('更新投票失敗:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('更新投票異常:', err);
        throw err;
    }
}

/**
 * 獲取活躍投票列表
 */
async function getActivePolls() {
    try {
        const { data, error } = await supabase
            .from('active_polls')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('獲取活躍投票失敗:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('獲取活躍投票異常:', err);
        return [];
    }
}

/**
 * 獲取歷史投票列表
 */
async function getHistoryPolls() {
    try {
        const { data, error } = await supabase
            .from('history_polls')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100); // 限制返回數量

        if (error) {
            console.error('獲取歷史投票失敗:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('獲取歷史投票異常:', err);
        return [];
    }
}

/**
 * 根據用戶ID獲取投票
 */
async function getUserPolls(userId) {
    try {
        // 獲取活躍投票
        const { data: activeData, error: activeError } = await supabase
            .from('active_polls')
            .select('*')
            .eq('created_by', userId)
            .order('created_at', { ascending: false });

        if (activeError) {
            console.error('獲取用戶活躍投票失敗:', activeError);
        }

        // 獲取歷史投票
        const { data: historyData, error: historyError } = await supabase
            .from('history_polls')
            .select('*')
            .eq('created_by', userId)
            .order('created_at', { ascending: false });

        if (historyError) {
            console.error('獲取用戶歷史投票失敗:', historyError);
        }

        return {
            active: activeData || [],
            history: historyData || [],
            total: (activeData?.length || 0) + (historyData?.length || 0)
        };
    } catch (err) {
        console.error('獲取用戶投票異常:', err);
        return { active: [], history: [], total: 0 };
    }
}

/**
 * 清理過期投票（使用管理員權限）
 */
async function cleanupExpiredPolls() {
    if (!supabaseAdmin) {
        console.warn('⚠️ 無法執行清理操作，缺少管理員權限');
        return;
    }

    try {
        const { error } = await supabaseAdmin.rpc('cleanup_expired_polls');
        
        if (error) {
            console.error('清理過期投票失敗:', error);
        } else {
            console.log('✅ 過期投票清理完成');
        }
    } catch (err) {
        console.error('清理過期投票異常:', err);
    }
}

/**
 * 更新過期投票的活躍狀態
 */
async function updateExpiredPolls() {
    try {
        const { error } = await supabase
            .from('polls')
            .update({ is_active: false })
            .lt('expires_at', new Date().toISOString())
            .eq('is_active', true);

        if (error) {
            console.error('更新過期投票狀態失敗:', error);
        } else {
            console.log('✅ 過期投票狀態更新完成');
        }
    } catch (err) {
        console.error('更新過期投票狀態異常:', err);
    }
}

module.exports = {
    supabase,
    supabaseAdmin,
    testConnection,
    createPoll,
    getPoll,
    updatePollVote,
    getActivePolls,
    getHistoryPolls,
    getUserPolls,
    cleanupExpiredPolls,
    updateExpiredPolls
};