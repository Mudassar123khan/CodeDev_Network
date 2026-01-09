

const fetchLeetcodeStats = async (handle)=>{
    return {
        handle,
        rating:0,
        solvedCount:0,
        lastSynced:new Date()
    }
}

export default fetchLeetcodeStats;