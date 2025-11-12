const mongoose = require('mongoose');

const HttpLogSchema = new mongoose.Schema({
    id : {type:String, required: true, unique: true},
    date: {type: Date, required: true},
    user: {type: String, required:true},
    pc: {type: String},
    url: {type: String},
    method: {type: String},
    referrer: {type: String},
    user_agent: {type: String},
    src_ip: {type: String},
    dest_ip: {type: String},
    category: {type: String},
    response_code: {type: Number},
    bytes: {type: Number},
    raw: {type: mongoose.Schema.Types.Mixed}
}, {
    collection: 'http_logs',
    timestamps: true
});

HttpLogSchema.index({user:1, date: -1});
HttpLogSchema.index({url: 1});
HttpLogSchema.index({pc:1, date: -1});

module.exports = mongoose.model('HttpLog', HttpLogSchema);