import config from './config.js?v=22'



class MessageBroker {

	constructor(){

		this.subscribers = {}

		if( config.EXPOSE ) window.EVENTS = {}

	}

	publish( event, data ){

		if( !this.subscribers[ event ] ) return

		// if( 0 && config.LOCAL && !config.LOG_BROKER_EXCLUDES.includes( event ) ){
		// 	if( event !== 'SOCKET_SEND' || !config.LOG_WS_SEND_EXCLUDES.includes( data.type ) ){
		// 		console.log( event, data )
		// 	}
		// }

	    this.subscribers[ event ].forEach( subscriberCallback => subscriberCallback( data ) )

	}

	subscribe( event, callback ){

		if( !this.subscribers[event] ){
			this.subscribers[event] = []
			if( config.EXPOSE ) window.EVENTS[ event ] = true
			// if( config.LOG_BROKER.SUBSCRIBE ) console.log('subscribe: ', event )
		}
	    
	    this.subscribers[event].push( callback )

	}

}

const broker = new MessageBroker()

if( config.EXPOSE ) window.BROKER = broker

export default broker

