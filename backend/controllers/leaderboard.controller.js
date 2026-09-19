import ExternalStats from "../models/ExternalStats.js";
import { getCache, setCache } from "../services/cache.service.js";


const getleaderBoard = async (req, res) => {
    try {
        const platform = req.query.platform; // codeforces | codechef | gfg | leetcode
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = req.query.limit === "all" ? 0 : Math.max(1, parseInt(req.query.limit) || 100);
        const skip = limit > 0 ? (page - 1) * limit : 0;

        // Check cache
        const cacheKey = `leaderboard:${platform || "overall"}:p${page}:l${limit}`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        const sortField = platform
            ? { [`platformScores.${platform}`]: -1 }
            : { totalScore: -1 };

        let query = ExternalStats.find()
            .select("userId totalSolved totalScore platformScores")
            .populate("userId", "username -_id")
            .sort(sortField)
            .lean();

        if (limit > 0) {
            query = query.skip(skip).limit(limit);
        }


        const [totalUsers, leaderboard] = await Promise.all([
            ExternalStats.countDocuments(),
            query.exec()
        ]);

        if (!leaderboard || leaderboard.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No data found",
                data: [],
                pagination: {
                    page,
                    limit: limit || totalUsers,
                    totalUsers,
                    totalPages: limit > 0 ? Math.ceil(totalUsers / limit) : 1
                }
            });
        }

        // Filter out any documents with missing user references
        const validLeaderboard = leaderboard.filter(item => item && item.userId);

        const rankedLeaderboard = validLeaderboard.map((item, index) => ({
            rank: skip + index + 1,
            ...item
        }));

        const responsePayload = {
            success: true,
            message: "Data found",
            data: rankedLeaderboard,
            pagination: {
                page,
                limit: limit || totalUsers,
                totalUsers,
                totalPages: limit > 0 ? Math.ceil(totalUsers / limit) : 1
            }
        };

        // Cache for 120 seconds
        await setCache(cacheKey, responsePayload, 120);

        res.status(200).json(responsePayload);
        
    } catch (err) {
        console.log(`An error occurred, message: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export default getleaderBoard;