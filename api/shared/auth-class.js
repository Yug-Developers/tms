const axios = require('axios')
const Config = require('../Config')

module.exports = {
    getUserPermission: async (config = {}) => {
        const userId = config.userId || 0
        const token = config.token || ''
        try {
            const data = {userId, fncts: Config.permissions}
            const res = await axios({
                method: 'POST',
                url: Config.getAuthB2BUrl + '/is-user',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                data
            })
            return res.data.content
        } catch (error) {
            console.error(error);
        }

    },
    getContractorsManagers: async (config = {}) => {
        const contractorId = config.contractorId || 0
        const token = config.token || ''
        try {
            const res = await axios({
                method: 'GET',
                url: Config.getAuthB2BUrl + '/get-managers-by-contractor',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                params: {contractorId}
            })
            return res.data.content || []
        } catch (error) {
            console.error(error);
        }
    }
}