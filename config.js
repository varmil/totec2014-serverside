module.exports = (function () {
    var common = require('./config/common');
    return {
        database: {
            host: common.database.host,
            port: common.database.port,
            user: common.database.username,
            password: common.database.password,
            database: common.database.dbname
        }
    };
}());