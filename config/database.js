if(process.env.NODE_ENV === 'production'){
	module.exports = {mongoURI: 'mongodb://atkaa92:kar6670929497@ds237848.mlab.com:37848/vidjot-92'}
}else{
	module.exports = {mongoURI: 'mongodb://127.0.0.1/chat'}
}