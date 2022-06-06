import config from './config.js?v=39'

const user = {}

if( config.EXPOSE ) window.USER = user

user.hydrate = data => {
	for( const key in data ){
		user[ key ] = data[ key ]
	}
	const id = document.querySelector('#id-credentials')
	if( id ) id.innerHTML += data?.handle + '<br>' + data?._email
}

export default user