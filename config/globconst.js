if(process.env.NODE_ENV === 'production'){
	module.exports = {
			mongoURI: 'mongodb://atkaa92:kar6670929497@ds127376.mlab.com:27376/externalchat',
			socketURI: 'https://glacial-eyrie-73246.herokuapp.com',
		}
}else{
	module.exports = {
		mongoURI: 'mongodb://127.0.0.1/chat',
		socketURI: 'http://localhost:5000',
	}
}