import config from './config.js?v=22'

const client_data = {
	BLOOM_LAYER: 1,
	ENTIRE_SCENE_LAYER: 0,
}

const spoof_data = { // replaces GLOBAL injection in standard emu

	PUBLIC_ROOT: '',

	BOARDS: {
		USER_LIMIT: 3,
		UNLOGGED_LIMIT: 3,
		CONTENT_LIMIT: 60 * 1000,
	},

	SLUG_LENGTH: 12,

}

let glob = false

export default ( () => {

	if( glob ) return glob

	try{
		glob = {}
		for( const key in client_data ) glob[ key ] = client_data[ key ]
		for( const key in spoof_data ) glob[ key ] = spoof_data[ key ]
	}catch( e ){
		alert('error parsing server data')
		console.log( e )
	}

	if( config.EXPOSE )  window.GLOBAL = glob

	return glob

})()