import hal from './hal.js?v=40'
import GLOBAL from './GLOBAL.js?v=40'



const colors = {
	cred: 'rgb(255, 210, 100)',
}




function ensureHex(recvd_color){

	if(recvd_color == undefined || recvd_color == null || recvd_color == '' || recvd_color=='white'){ 
		return '#ffffff' 
	}
	if(recvd_color.match(/#/)){
		return recvd_color
	}
	if(recvd_color.length == 6 || recvd_color.length == 8){
		return '#' + recvd_color
	}
	if(recvd_color.match(/rgb/)){ // should always be hex
		var the_numbers = recvd_color.split('(')[1].split(')')[0]
		the_numbers = the_numbers.split(',')
		var b = the_numbers.map(function(x){						 
			x = parseInt(x).toString(16)	
			return (x.length==1) ? '0'+x : x 
		})
		b = b.join('')
		return b
	}else{
		return '#ffffff'
	}
	
}


function capitalize( word ){

	if( typeof( word ) !== 'string' ) return false

	let v = word.substr( 1 )

	word = word[0].toUpperCase() + v

	return word

}



function random_hex( len ){

	//	let r = '#' + Math.floor( Math.random() * 16777215 ).toString(16)
	let s = ''
	
	for( let i = 0; i < len; i++){
		s += Math.floor( Math.random() * 16 ).toString( 16 )
	}
	
	return s

}

function iso_to_ms( iso ){

	let isoTest = new RegExp( /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/ )

    if( isoTest.test( str ) ){
    	return new Date( iso ).getTime()
    }
    return false 

}

function ms_to_iso( ms ){

	if( typeof( ms ) !=  'number' )  return false

	return new Date( ms ).toISOString()

}


function is_emu_uuid( data ){
	/*
		NOT a technical uuid - Emu specific
	*/

	if( typeof data === 'string' && data.length === GLOBAL.SLUG_LENGTH ) return true
	return false

}

const parse_slug = value => {
	if( typeof value === 'string' && value.match(/\/board\//) ){
		return value.substr( value.indexOf('/board/') + 7 )
	}else{
		return value
	} 
}


function getBaseLog(x, y) {

	return Math.log(y) / Math.log(x)

}

function scry( x, old_min, old_max, new_min, new_max ){

	const first_ratio = ( x - old_min ) / ( old_max - old_min )
	const result = ( first_ratio * ( new_max - new_min ) ) + new_min
	return result
}








// selection.add( this.mesh )





function validate_number( ...vals ){

	for( const num of vals ){
		if( typeof num === 'number' || ( num && typeof Number( num ) === 'number' ) ) return Number( num )
	}
	return vals[ vals.length - 1 ]

}



const random_range = ( low, high, int ) => {

	if( low >= high ) return low

	return int ? Math.floor( low + ( Math.random() * ( high - low ) ) ) : low + ( Math.random() * ( high - low ) )

}

const random_entry = source => {

	if( Array.isArray( source )){
		return source[ random_range( 0, source.length - 1, true ) ]
	}else if( source && typeof source === 'object'){
		return source[ random_entry( Object.keys( source ) ) ]
	}
	return ''
}




const button = ( message, callback ) => {
	const ele = document.createElement('div')
	ele.innerHTML = message
	ele.classList.add('button')
	ele.addEventListener('click', () => {
		callback()
	})
	return ele
}






const return_fail = ( console_msg, hal_msg, hal_type ) => {
	console.log( console_msg )
	if( hal_msg ) hal( hal_type || 'error', hal_msg, 4000 )
	return false
}



const to_alphanum = ( value, loose ) => {
	if( typeof value !== 'string' ) return false
	if( loose ){
		return value.replace(/([^a-zA-Z0-9 _-|.|\n|!])/g, '')
	}else{
		return value.replace(/([^a-zA-Z0-9 _-])/g, '')
	}
}



const is_unix_timestamp = timestamp => { // returns true if correct string or number length
	if( typeof timestamp === 'number' ){
		return String( timestamp ).length === 10
	}else if( typeof timestamp === 'string' && timestamp.length === 10 && typeof Number( timestamp ) === 'number' ){
		return true
	}
	return false
}







const trimStrict = string => {
    // Remove leading spaces
    while(string.indexOf('    ') === 0) {
        string = string.substr(1);
    }
    // Remove trailing spaces
    // while(string[string.length-4] === '    ') {
    while(string.match(/    $/) ){
        string = string.substr(0, string.length-1);
    }
    return string;
}


let cap_store = {}
const over_cap = ( key, limit ) => {
	/*
		true = over cap
		false = still ok
	*/
	if( !cap_store[ key] ) cap_store[ key] = 0
	if( !limit ) return false
	cap_store[ key]++
	return cap_store[ key ] > limit
}


const generate_content = len => {
	len = len || 50
	const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
	return lorem.substr(0, len ) + '....'
}


const get_index = ( nodeList, ele ) => {
	for( let i = 0; i < nodeList.length; i++ ){
		if( nodeList[i] === ele ) return i
	}
}


// const shift_element = window.shift_element = ( dir, ele, identifier, cycle ) => {
// 	/*
// 		***
// 		'dir' refers to -index order-, not screen space or DOM order
// 		***
// 	*/
// 	if( !ele ){
// 		console.log('missing ele for shift')
// 		return
// 	}
// 	const siblings = ele.parentElement.querySelectorAll( identifier )
// 	if( !siblings?.length ){
// 		console.log('no siblings for shift')
// 		return
// 	}

// 	const index = get_index( siblings, ele )
// 	if( typeof index !== 'number' ){
// 		console.log('invalid move', ele, index)
// 		return
// 	}
// 	let prev_sib = siblings[ index - 1 ]
// 	let next_sib = siblings[ index + 2 ]

// 	console.log( 'shift index :', dir, !!prev_sib )

// 	switch( dir ){

// 		case 'up':
// 			/*
// 				[parent] insertBefore [insertion node] [reference node]
// 			*/
// 			if( !next_sib ){
// 				if( siblings[ index + 1 ]){
// 					ele.parentElement.appendChild( ele )
// 					return
// 				}else if( cycle ){
// 					ele.parentElement.insertBefore( ele, siblings[0] )
// 					return
// 				}
// 			}
// 			ele.parentElement.insertBefore( ele, next_sib )
// 			break;

// 		case 'down':
// 			if( !prev_sib ){
// 				if( !cycle ){ // because null child ref will still work otherwise
// 					console.log('no prev sib for shift')
// 					return
// 				}else{
// 					/*
// 						this assumes that there is no other content in parentElement
// 						in some cases this could be bad
// 					*/
// 					ele.parentElement.appendChild( ele )
// 					return
// 				}
// 			}
// 			ele.parentElement.insertBefore( ele, prev_sib )
// 			break;

// 		default: 
// 			console.log('invalid shift dir', dir )
// 			break;

// 	}

// }




const is_hex_color = color => {
	return ( typeof color === 'string' && !color.match(/[g-z]/i) && color.length >= 6 && color.length <= 9 )
}

const char_map = {
	a: 10,
	b: 11,
	c: 12,
	d: 13,
	e: 14,
	f: 15,
}

const offset_color = ( color, contrast ) => {
	if( !is_hex_color( color )){
		console.log('invalid hex color: ', color )
		return contrast ? '#000000' : '#222222'
	}

	let c = color.replace('#', '').substr(0,6)

	// console.log('testing bg color: ', color, c )

	let num
	const rgb = {r: 0, g: 0, b: 0}
	for( let i = 0; i < c.length; i++ ){

		const n = Number( c[i] )

		if( typeof n === 'number' && !isNaN( n ) ){
			num = n
		}else if( char_map[ c[i] ]){
			num = char_map[ c[i] ]
		}else{
			num = 0
			// console.log('invalid num', n )
		}

		// console.log(`adding index ${ i } color: ${ num }`)

		if( i < 2 ){ // red
			rgb.r += ( i === 0 ) ? num * 16 : num
		}else if( i < 4 ){ // green
			rgb.g += ( i === 2 ) ? num * 16 : num
		}else{ // blue
			rgb.b += ( i === 4 ) ? num * 16 : num
		}

	}

	// console.log(`rgb res:`, rgb )

	// https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color
	const computed = ( rgb.r * .299 ) + ( rgb.g * .587 ) + ( rgb.b * .114 )

	// console.log('computed bg value: ', computed )

	if( computed > 150 ){ // 186 standard
		return contrast ? '#000000' : '#222222'
	}else{
		return contrast ? '#ffffff' : '#dddddd'
	}

}



const b = ( type, id, ...classes ) => {
	const ele = document.createElement( type )
	if( id ) ele.id = id
	for( const c of classes || [] ) ele.classList.add( c )
	return ele
}




export {

	ensureHex,
	capitalize,
	random_hex,
	iso_to_ms,
	ms_to_iso,
	getBaseLog,
	scry,
	is_emu_uuid,
	parse_slug,
	
	validate_number,
	random_entry,
	random_range,

	button,

	return_fail,

	to_alphanum,
	colors,

	is_unix_timestamp,

	trimStrict,
	over_cap,
	generate_content,
	get_index,
	// shift_element,
	offset_color,
	is_hex_color,
	b,
}