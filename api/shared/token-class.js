const jwt = require('jsonwebtoken')
const Config = require('../Config')

// подмена пользователя
const userId = {
    16896: null,//881,
    713: null, //881,
    11: null
    // 11: 436
}

const getTokenData = (req) => {
    let token = ''
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        token = req.headers.authorization.split(' ')[1]
    }
    let decoded = {}
    try {
        decoded = jwt.verify(token, Config.jwt.secret)
    } catch (err) {
        return 0
    }
    return decoded || {}
}

const createToken = (id) => {
    const deviceId = 0
    const token = jwt.sign({
        id,
        deviceId
    }, Config.jwt.secret, {
        expiresIn: Config.jwt.expire
    })
    return token
}

exports.uid = (req) => {
    const tokenData = getTokenData(req)
    if (tokenData && tokenData.id && userId[tokenData.id]) {
        return userId[tokenData.id]
    }
    let token = ''
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        token = req.headers.authorization.split(' ')[1]
    }
    let decoded = {}
    try {
        decoded = jwt.verify(token, Config.jwt.secret)
    } catch (err) {
        return 0
    }
    return decoded.id || 0
}

exports.data = (req) => {
    return getTokenData(req)
}

exports.token = (req) => {
    const tokenData = getTokenData(req)
    if (tokenData && tokenData.id && userId[tokenData.id]) {
        return createToken(userId[tokenData.id])
    }
    let token = ''
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        token = req.headers.authorization.split(' ')[1]
    }
    return token
}

exports.create = createToken

