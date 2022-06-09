// import config from './config.js?v=39'
import WS from './WS.js?v=39'
import hal from './hal.js?v=39'
// import fetch_wrap from './fetch_wrap.js?v=39'
import * as lib from './lib.js?v=39'
import ui from './ui.js?v=39'
// import {
// 	Modal,
// } from './Modal.js?v=39'
import {
	boards,
	scratch,
	priv, // private boards wrapper
	invites,// public boards wrapper
	line_place,
	line_total,
} from  './board_ui.js?v=39' 
import BROKER from './EventBroker.js?v=39'
import USER from './USER.js?v=39'
import GLOBAL from './GLOBAL.js?v=39'
import pop_options_modal from './board_settings.js?v=39'



const SKIP_KEYS = [
	// super keys
	16,17,18,20, 27,
	// directional / nav keys
	33,34, 35,36, 37,38,39,40
]




const header = document.querySelector('#header')
// const content = document.querySelector('#content')

document.body.classList.add('board')

// const is_auth = header.getAttribute('data-auth') === 'true'
// const is_admin = header.getAttribute('data-admin') === 'true'











// --------------------------------------------------------------------------------------------------------------------------------------------
// lib
// --------------------------------------------------------------------------------------------------------------------------------------------

const BOARDS = window.BOARDS = {}
const USERS = window.USERS = {}


class Board {
	constructor( init ){
		init = init || {}
		this.name = init.name
		this.uuid = init.uuid
		this.owner_uuid = init.owner_uuid
		this.user_uuids = []

		// DOM
		this.build_tab()
	}
	// build_tab(){
	// 	this.tab = document.createElement('div')
	// 	this.tab.classList.add('button')
	// 	this.tab.title = 'click to set active: ' + this.name
	// 	this.tab.innerHTML = this.name || this.uuid.substr(0,4)
	// 	this.tab.setAttribute('data-uuid', this.uuid )
	// 	setTimeout(() => {
	// 		this.tab.appendChild( this.build_arrow(1) )
	// 		this.tab.appendChild( this.build_arrow(0) )			
	// 	}, 200 )
	// 	this.tab.addEventListener('click', e => {
	// 		if( e.target.classList.contains('dir-arrow')) return
	// 		BROKER.publish('BOARD_SET_ACTIVE', {
	// 			uuid: this.uuid,
	// 		})
	// 	})
	// }
	build_tab(){
		this.tab = document.createElement('div')
		this.tab.classList.add('tab')
		this.button = document.createElement('div')
		this.button.classList.add('button')
		this.tab.appendChild( this.button )
		this.tab.title = 'click to set active: ' + this.name
		this.button.innerHTML = this.name || this.uuid.substr(0,4)
		this.tab.setAttribute('data-uuid', this.uuid )
		setTimeout(() => {
			this.tab.appendChild( this.build_arrow(1) )
			this.tab.appendChild( this.build_arrow(0) )			
		}, 200 )
		this.button.addEventListener('click', e => {
			if( e.target.classList.contains('dir-arrow')) return
			if( saving ) send_save()
				// return hal('error', 'wait for save to complete..', 750 )
			BROKER.publish('BOARD_SET_ACTIVE', {
				uuid: this.uuid,
			})
		})

		// eye icon
		const is_priv = this.is_priv = document.createElement('div')
		is_priv.classList.add('tab-toggle', 'private')
		// is_priv.innerHTML = '<img src="/resource/media/eye.svg">'
		const img_priv = this.img_priv = document.createElement('img')
		img_priv.src = '/resource/media/eye.png'
		is_priv.appendChild( img_priv )
		is_priv.addEventListener('click', set_public )
		this.tab.prepend( is_priv )

		// lock icon
		const is_lock = this.is_lock = document.createElement('div')
		is_lock.classList.add('tab-toggle', 'public')
		// is_lock.innerHTML = '<img src="/resource/media/lock.png">'
		const img_lock = this.img_lock = document.createElement('img')
		img_lock.src = '/resource/media/pencil.png'
		is_lock.appendChild( img_lock )
		is_lock.addEventListener('click', set_locked )
		this.tab.prepend( is_lock )

		// const is_priv = this.is_priv = document.createElement('div')
		// is_priv.classList.add('tab-toggle', 'private')
		// is_priv.innerHTML = '<img src="/resource/media/eye.svg">'
		// is_priv.addEventListener('click', set_public )
		// this.tab.prepend( is_priv )
		// const is_lock = this.is_lock = document.createElement('div')
		// is_lock.classList.add('tab-toggle', 'public')
		// // is_lock.innerHTML = '<img src="/resource/media/pencil.png">'
		// is_lock.innerHTML = '<img src="/resource/media/lock.png">'
		// is_lock.addEventListener('click', set_locked )
		// this.tab.prepend( is_lock )
	}
	build_arrow( dir ){
		const wrapper = document.createElement('div')
		wrapper.innerHTML = dir ? '&uarr;' : '&darr;'
		wrapper.setAttribute('data-dir', dir )
		wrapper.classList.add('dir-arrow', ( dir ? 'up' : 'down') )
		wrapper.addEventListener('click', move_tab )
		return wrapper
	}

}

class User {
	constructor( init ){
		init = init || {}
		this.uuid = init.uuid
		this.handle = init.handle
		this.color = init.color

		this._email = init._email // for user 1
	}
}


const render_colors = board_data => {

	if( !board_data ){
		scratch.style.color = '#96fa96'
		scratch.style.background = '#232323'
		return
	}

	// scratch colors
	if( get_active_board() === board_data?.uuid ){
		if( board_data.fg_color ) scratch.style.color = board_data.fg_color
		if( board_data.bg_color ) scratch.style['background-color'] = board_data.bg_color		
	}
	// tab colors
	if( board_data.tab_color ){
		const selector = '.button'
		const tab = boards.querySelector('.tab[data-uuid="' + board_data.uuid + '"]')
		const btn = tab.querySelector( selector )
		if( btn ){
			btn.style['background'] = board_data.tab_color //+ '99'
			console.log(`testing ${ board_data.name }`)
			const c = lib.offset_color( board_data.tab_color, true )
			// console.log('renderd : ', c )
			btn.style.color = c
		}else{
			console.log('invalid button', tab, btn )
		}
	}
}


// const render_colors = board_data => {
// 	if( board_data.fg_color ) scratch.style.color = board_data.fg_color
// 	if( board_data.bg_color ) scratch.style['background-color'] = board_data.bg_color
// 	if( board_data.tab_color ){
// 		const btn = boards.querySelector('.tab[data-uuid="' + board_data.uuid + '"] .button')
// 		if( btn ){
// 			btn.style['background'] = board_data.tab_color //+ '99'
// 		}
// 	}
// }


const update_line = e => {
	if( typeof scratch.selectionStart === 'number' ){
		const sub = scratch.value.substr( 0, scratch.selectionStart )
		const match = sub.match(/\n/g)
		const n = ( match?.length || 0 ) + 1
		line_place.innerHTML = 'line: ' + n
	}
}

const get_selection = textarea => {
	const cursor = [textarea.selectionStart, textarea.selectionEnd]
	return textarea.value.substr( cursor[0], ( cursor[1] - cursor[0] ) )
}

const move_tab = e => {
	const tab = e.target.parentElement
	const dir = e.target.getAttribute('data-dir')

	const shift = Number( dir ) ? 'down': 'up'

	lib.shift_element( shift, tab, '.tab', true )

	setTimeout(() => { // idk what it is about DOM operations...
		BROKER.publish('SOCKET_SEND', {
			type: 'save_index',
			index: build_index(),
		})		
	}, 100 )


}

const build_index = () => {
	const index = {
		account: [],
		all: [],
	}
	for( const btn of priv.querySelectorAll('.tab')) index.account.push( btn.getAttribute('data-uuid'))
	for( const btn of invites.querySelectorAll('.tab')) index.all.push( btn.getAttribute('data-uuid'))
	return index
}


















// --------------------------------------------------------------------------------------------------------------------------------------------
// listeners
// --------------------------------------------------------------------------------------------------------------------------------------------

let saving = false
let typing = false
scratch.addEventListener('keydown', e => { // keyup seems to get 'just entered window' release events

	// console.log( e.keyCode )
	if( SKIP_KEYS.includes( e.keyCode )) return

	if( !typing ){
		BROKER.publish('SOCKET_SEND', {
			type: 'touch',
			uuid: get_active_board(),
		})
		typing = setTimeout(() => {
			clearTimeout( typing )
			typing = false
			update_line(e)
		}, GLOBAL.BOARDS.SAVE_INTERVAL )

	}
	
	if( saving ) clearTimeout( saving )
	saving = setTimeout(()=>{
		// if( !get_active_board() ) return
		BROKER.publish('BOARD_SAVE')
		clearTimeout( saving )
		saving = false
	}, GLOBAL.BOARDS.SAVE_INTERVAL)
})

scratch.addEventListener('click', e => { // keyup seems to get 'just entered window' release events
	update_line(e)
})

window.addEventListener('keyup', e => {
	if( e.keyCode === 27 ){
		const editor = document.querySelector('.modal.board_options')
		if( editor ){
			editor.querySelector('.modal-close').click()
		}else{
			document.getElementById('options').click()
		}

	}
})

window.addEventListener('popstate', e => { // browser nav actions
	setTimeout(() => {
		const active = location.href.split('/board/')[1]
		if( active ) set_active({
			uuid: active,
			skip_state: true, // user has just manually navigated history; we don't want to create entries for that
		})
	}, 200)
})



// init listener:
scratch.value = '(click anywhere on board to initialize connection)'
let initializing_boards = false
let initialized_boards = false // the main init bool

scratch.addEventListener('click', () => {
	if( initializing_boards || initialized_boards ) return
	hal('success', 'initializing...', 1000 )
	BROKER.publish('SOCKET_SEND', {
		type: 'EXT_init_boards',
	})
	initializing_boards = true
	setTimeout(() => {
		if( !initialized_boards ){
			hal('error', 'there seems to have been a problem establishing connection; try refreshing the page' )
		}
	}, 5000)
	
})

// window.addEventListener('pushstate', e => { // browser nav actions
// 	// console.log( e )
// 	setTimeout(() => {
// 		const active = location.href.split('/board/')[1]
// 		// console.log('popstate set active.. ?', active )
// 		if( active ) set_active({
// 			uuid: active,
// 		})
// 	}, 200)
// })

scratch.addEventListener('keydown', e => {
	if( e.keyCode === 9 || e.key === 'Tab' ){
		e.preventDefault()
		const start = scratch.selectionStart;
	    const end = scratch.selectionEnd;

		scratch.value = scratch.value.substring(0, start) + '\t' + scratch.value.substring(end);

		// put caret at right position again
		scratch.selectionStart = scratch.selectionEnd = start + 1;
	}
})





















// --------------------------------------------------------------------------------------------------------------------------------------------
// DOM builders
// --------------------------------------------------------------------------------------------------------------------------------------------





















// --------------------------------------------------------------------------------------------------------------------------------------------
// clientside handlers
// --------------------------------------------------------------------------------------------------------------------------------------------

const preview_anchor = e => {
	let anchor
	if( e.target.classList.contains('anchor')){
		anchor = e.target
	}else{
		anchor = e.target.parentElement
	}
	const uuid = anchor.getAttribute('data-uuid')
	BROKER.publish('SOCKET_SEND', {
		type: 'ping_anchor',
		uuid: uuid,
		board_uuid: get_active_board(),
	})

}



const set_active = event => { // private or public

	console.log( 'set-active', event )

	event = event || {}

	const { uuid, skip_state } = event

	// handle button
	for( const b of boards.querySelectorAll('.tab')){
		b.classList.remove('active')
	}

	if( !uuid ){ // leave / set empty

		scratch.value = ''

		render_colors()
		delete localStorage['emu-active-tab']

	}else{

		// validate
		const board = BOARDS[ uuid ]
		const btn = boards.querySelector('.tab[data-uuid="' + uuid + '"]')
		if( !btn || !board ){
			console.log(`invalid set-active target-uuid (${ uuid }) uuid (${ uuid })`)
			return
		}		
		btn.classList.add('active')
		scratch.value = board.content

		render_colors( board )
		localStorage.setItem('emu-active-tab', uuid )

	}

}


const save = event => {
	/*
		finds and saves only the active board
		should probably decouple this.. 
		a) find any board
		b) save that board
	*/
	const active = get_active_board()
	const board = BOARDS[ active ]
	if( !board ){
		hal('error', 'save: ' + ( !active ? 'no board selected' : 'invalid active board' ), 3000)
		return
	}

	BROKER.publish('SOCKET_SEND', {
		type: 'save',
		uuid: active,
		content: lib.trimStrict( scratch.value ),
		user_uuid: USER?.uuid,
	})

}



const set_toggle = ( e, option )  => {
	const toggle = e.target.classList.contains('tab-toggle') ? e.target : e.target.parentElement
	const tab = toggle.parentElement
	// toggle.classList.contains('.tab') ? e.target.parentElement : e.target.parentElement.parentElement
	let state = toggle.classList.contains('checked')
	// if( option === 'is_private' ){
	// 	state = !state
	// }
	const packet = {
		type: 'board_set_option',
		uuid: tab.getAttribute('data-uuid'),
		option: option,
		state: state,
	}
	console.log('sending state: ', packet )

	BROKER.publish('SOCKET_SEND', packet)

}



const set_public = e => {
	set_toggle( e, 'is_private')
}
const set_locked = e => {
	set_toggle( e, 'is_locked')
}

// stagger handle-board responses to avoid drowning the screen
let staggering = false
let staggered_boards = []
const stagger_success = board => {
	staggered_boards.push( board )
	if( staggering ) return
	staggering = setTimeout(() => {
		let msg
		if( staggered_boards.length > 1 ){
			msg = staggered_boards.length + ' boards updated'
		}else{
			msg = 'board updated: ' + staggered_boards[0].name
		}
		hal('success', msg, GLOBAL.BOARDS.SAVE_INTERVAL * 1.5 )
		staggered_boards.length = 0
		clearTimeout( staggering )
		staggering = false
	}, 1000 )
}


























// --------------------------------------------------------------------------------------------------------------------------------------------
// server handlers
// --------------------------------------------------------------------------------------------------------------------------------------------

const handle_user = event => {
	const { user, board } = event

	// global user subs
	if( !USERS[ user.uuid ] ){
		USERS[ user.uuid ] = new User( user )
	}

	const b = BOARDS[ board.uuid ]
	if( !b ){

		if( lib.over_cap('ping_board', 100) ) throw new Error('board requested too many times; erroring to prevent loop')

		BROKER.publish('SOCKET_SEND', {
			type: 'ping_board',
			uuid: board.uuid,
		})
		console.log('pinging board')
		return
	}

	// board subs
	if( !b.user_uuids.includes( user.uuid ) ){
		b.user_uuids.push( user.uuid )
	}

}

const handle_users = event => {
	/*
		user uuids only, for ping/pong
	*/
	console.log( event )


}





const handle_board = event => {

	const { board, user_uuid } = event

	console.log( event )

	// validate
	if( typeof board.uuid !== 'string' ){
		console.log('invalid board pong', board )
		return
	}

	// touch board
	let b = BOARDS[ board.uuid ]
	if( !b ){ // handle new board
		BOARDS[ board.uuid ] = b = new Board( board )
		if( board.is_owner ){
			priv.appendChild( b.tab )
		}else{
			invites.appendChild( b.tab )
		}
	}else{ // update existing board
		b.content = board.content 
	}	

	// hydrate board from response
	for( const key in board ){
		b[ key ] = board[ key ]
	}

	// render board if active
	if( get_active_board() === b.uuid ){

		const selection_index = [scratch.selectionStart, scratch.selectionEnd]

		const selection_content = get_selection( scratch )

		scratch.value = b.content || ''// lib.generate_content()

		const value_check = scratch.value.substr( selection_index[0], ( selection_index[1] - selection_index[0] ))

		// if selection matches, set it selected again
		if( value_check === selection_content ){
			scratch.selectionStart = selection_index[0]
			scratch.selectionEnd = selection_index[1]
		}

		update_line()

	}else if( USER.awaiting_hash && USER.awaiting_hash === board.created_hash ){ // just created this board

		delete USER.awaiting_hash
		b.tab.click()

	}

	// render private / locked
	if( board.is_private ){
		b.is_priv.classList.remove('checked')
		b.is_priv.title = 'board is private - only the owner may view'
		b.img_priv.src = '/resource/media/eye-closed.png'
	}else{
		b.is_priv.classList.add('checked')
		b.is_priv.title = 'board is public - anyone with the URL may view'
		b.img_priv.src = '/resource/media/eye.png'
	}
	b.is_private = board.is_private

	if( board.is_locked ){
		b.is_lock.title = 'board is locked - only the owner may edit'
		b.is_lock.classList.remove('checked')
	}else{
		b.is_lock.classList.add('checked')
		b.is_lock.title = 'board is open - anyone with the URL may edit'
	}
	b.is_locked = board.is_locked


	// tab
	const btn = boards.querySelector('.tab[data-uuid="' + board.uuid + '"] .button')
	if( btn ){
		btn.innerHTML = board.name
	}


	// colors
	render_colors( board )

	// display edit message
	if( user_uuid ){
		const user = USERS[ user_uuid ]
		if( !user ){
			console.log('missing origin user', user_uuid.substr(0,6))
			return
		}
		const msg = user_uuid === USER.uuid ? 'saved' : 'edited by ' + user.handle
		hal('success', msg, 4000 )
	}else{
		stagger_success( b )
	}

	// sort
	if( USER._board_order && !awaiting_sort ){
		awaiting_sort = setTimeout(() => {
			sort_boards()
			awaiting_sort = false
		}, 500 )
	}
	// if( USER._board_order ){
	// 	sort_boards()
	// }

}


let awaiting_sort = false
const sort_boards = () => {

	// console.log('sorting: ', USER._board_order )
	// console.log('sorting: ', USER._board_order ? JSON.parse( USER._board_order ).account.map( uuid => { 
	// 	return BOARDS[ uuid ]?.name || '(no name)'
	// } ) : '' )

	try{

		const sorted = JSON.parse( USER._board_order )

		// private
		const suspended_priv = priv.querySelectorAll('.tab')
		for( const btn of suspended_priv ) btn.remove()
		for( const uuid of sorted.account ){
			for( const ele of suspended_priv ){
				if( ele.getAttribute('data-uuid') === uuid ){
					priv.appendChild( ele )
				}
			}
		}
		for( const ele of suspended_priv ){
			if( !ele.parentElement ) priv.appendChild( ele )
		}

		// all
		const suspended_all = invites.querySelectorAll('.tab')
		for( const btn of suspended_all ) btn.remove()
		for( const uuid of sorted.all ){
			for( const ele of suspended_all ){
				if( ele.getAttribute('data-uuid') === uuid ){
					invites.appendChild( ele )
					// debugger
				}
			}
		}
		for( const ele of suspended_all ){
			if( !ele.parentElement ) invites.appendChild( ele )
		}

	}catch( err ){
		console.log( 'sort boards err: ', err )
	}

}





const handle_attendance = event => {
	const { all_users } = event
	console.log( 'handle users', event )

}






// const reflect_public_url = ( share_ele, board ) => {
// 	// console.log('?', share_ele )
// 	const share = share_ele.querySelector('.board-share')
// 	share.style.display = board.is_public ? 'block' : 'none'
// }

// const reflect_value = ( key, wrapper, board ) => {
// 	const input = wrapper.querySelector('input[' + key + '="' + board[ key ] + '"]')
// 	if( input ) input.value = board[ key ]
// }


// const reflect_options = event => {

// 	console.log('deprecated', event )

// 	// const { board, allowed_users } = event

// 	// // console.log( event )
// 	// const active = get_active_board()

// 	// const is_editing = document.querySelector('.modal[data-board-uuid="' + board?.uuid + '"]')

// 	// if( is_editing ){

// 	// 	// admin ripples
// 	// 	hal('success', 'board options updated', 3000)
// 	// 	// url
// 	// 	const wrapper = document.querySelector('.modal .board-share').parentElement
// 	// 	if( wrapper ){
// 	// 		reflect_public_url( wrapper, board )
// 	// 		reflect_value( 'name', wrapper, board )
// 	// 	}else{
// 	// 		console.log('missing public/private wrapper')
// 	// 	}

// 	// }else{
// 	// 	// users who happen to be on the board when its edited
// 	// 	// hal('standard', 'board options updated', 3000)

// 	// }

// 	// // board name
// 	// const btn = boards.querySelector('.button[data-uuid="' + board.uuid + '"]')
// 	// if( btn ) btn.innerText = board.name

// 	// // board public
// 	// if( BOARDS[ board.uuid ].is_public !== board.is_public ){
// 	// 	hal('standard', board.name + ' is now ' + ( board.is_public ? 'public' : 'private' ) , 10 * 1000 )
// 	// }

// 	// // colors
// 	// // if( active === board.uuid ){
// 	// render_colors( board )
// 	// // }

// 	// if( Array.isArray( allowed_users ) ){
// 	// 	// user list needs to be rendered separately probably
// 	// 	console.log('awaiting allowed users', allowed_users )		
// 	// }


// }



const board_touch = event => {
	const { board_uuid, user_uuid } = event
	const user = USERS[ user_uuid ]
	if( !user ){
		// console.log('no user for edit', user_uuid )
		BROKER.publish('SOCKET_SEND', {
			type: 'ping_user',
			board_uuid: board_uuid,
			user_uuid: user_uuid,
		})
		return
	}
	if( get_active_board() === board_uuid ){
		const msg = USER.uuid === user.uuid ? '...' : user.handle + ' typing...'
		hal('standard', `<span class='board-touch'>${ msg }</span>`, 2500 )		
	}

}


const pong_anchor = event => {
	const { anchor } = event
	anchor.content = ( anchor.content || '' )
	const content = document.querySelector('.modal-content')
	if( !content ){
		console.log('missing content')
		return
	}

	const date = new Date( anchor._created ).toLocaleString()

	// build preview
	const preview = document.createElement('div')
	preview.classList.add('anchor-preview')
	const expl = document.createElement('div')
	expl.innerText = 'Previewing anchor from: ' + date
	preview.appendChild( expl )
	const area = document.createElement('textarea')
	area.value = anchor.content
	area.disabled = true
	preview.appendChild( area )

	// set colors
	let fg_color, bg_color
	const active = BOARDS[ get_active_board() ]
	if( !active ){
		bg_color = '#232323'
		fg_color = '#96fa96'
	}
	area.style['background-color'] = active.bg_color || bg_color
	area.style.color = active.fg_color || fg_color
	const set = document.createElement('div')
	set.classList.add('button')
	set.innerHTML = 'set'
	set.addEventListener('click', () => {
		scratch.value = anchor.content
		hal('success', 'set board to anchor from:<br>' + date, 5000 )
		preview.remove()
	})
	preview.appendChild( set )
	const cancel = document.createElement('div')
	cancel.classList.add('button')
	cancel.innerHTML = 'cancel'
	cancel.addEventListener('click', () => {
		preview.remove()
	})
	preview.appendChild( cancel )
	content.appendChild( preview )
	// hal('standard', '(coming soon)<br><pre>' + anchor.content + '</pre>', 2000 )
	// console.log( anchor )
}

const init_complete = event => {
	// const {  } = event

	// if( !get_active_board() ){
	// 	scratch.value = ''
	// }

	set_active({ 
		uuid: localStorage.getItem('emu-active-tab'),
	})

	initialized_boards = true
	initializing_boards = false

}

const remove_board = event => {
	const { uuid, subtype, name } = event

	const board = BOARDS[ uuid ]
	if( !board ){ // this WILL happen usually because it removes with 'board.close()'
		// 
	}

	// close modal
	const modal = document.querySelector('.modal.board_options')
	if( modal ){
		modal.querySelector('.modal-close').click()
	}

	// clear textarea / styles
	if( get_active_board() === uuid ){
		scratch.value = ''
		delete scratch.style.background
		delete scratch.style.color
	}

	// remove from menu
	const btn = boards.querySelector('.tab[data-uuid="' + uuid + '"]')
	if( btn ) btn.remove()

	hal('success', ( subtype === 'leave' ? 'left' : 'deleted' ) + ' board: ' + name, 4000 )

}

const user_propagate = event => {
	const { user } = event

	console.log('propagating: ', user )

	for( const field in user ){
		USER[ field ] = user[ field ]
	}

}














// --------------------------------------------------------------------------------------------------------------------------------------------
// init
// --------------------------------------------------------------------------------------------------------------------------------------------

// clientside heartbeat
let last_ping = Date.now()
let last_ping_call = 0
let ping = () => {

	// returning idle browser tabs may fire this a ton
	if( Date.now() - last_ping_call < 100 ){ 
		hal('error', 'blocked multiple ping calls - you may need to refresh page', 5000 ) 
		return
	}

	last_ping_call = Date.now()

	// proceed with ping
	setTimeout(() => {
		if( !last_ping ){
			hal('error', 'server not responding; try refreshing page')
			return
		}
		BROKER.publish('SOCKET_SEND', {
			type: 'ping',
		})
		last_ping = false
		ping()

	}, 5 * 1000)

}
ping()

const pong = event => {
	last_ping = Date.now()
}



// on page load init

// let query_uuid

// if( location.href.match(/board\/.*/) ){
// 	query_uuid = location.href.split('/board/')[1]

// 	if( query_uuid ){

// 		console.log('loading ', query_uuid )

// 		let joining, btn
// 		let j = 0

// 		setTimeout(()=>{
// 			BROKER.publish('SOCKET_SEND', {
// 				type: 'join_board',
// 				uuid: query_uuid,
// 			})
// 			joining = setInterval(() => {
// 				btn = boards.querySelector('.button[data-uuid="' + query_uuid + '"]')
// 				if( btn ){
// 					btn.click()
// 					clearInterval( joining )
// 				}else{
// 					j++
// 				}
// 				if( j > 100 ){
// 					console.log('failed to join query board: ', query_uuid )
// 					clearInterval( joining )
// 				}

// 			}, 300)

// 		}, 200)

// 	}

// }



const socket = window.socket = WS.init()















BROKER.subscribe('PONG', pong )
BROKER.subscribe('BOARD_SET_ACTIVE', set_active )
BROKER.subscribe('BOARD_PONG_USER', handle_user )
BROKER.subscribe('BOARD_USERS', handle_users )
BROKER.subscribe('BOARD_SAVE', save )
BROKER.subscribe('BOARD_PONG_BOARD', handle_board )
BROKER.subscribe('BOARD_ATTENDANCE', handle_attendance )
BROKER.subscribe('BOARD_OPTIONS', pop_options_modal )
BROKER.subscribe('BOARD_REMOVED', remove_board )
// BROKER.subscribe('BOARD_REFLECT', reflect_options )
BROKER.subscribe('BOARD_PONG_ANCHOR', pong_anchor )
BROKER.subscribe('BOARD_TOUCH', board_touch )
BROKER.subscribe('BOARDS_INIT_COMPLETE', init_complete )
BROKER.subscribe('USER_PROPAGATE', user_propagate )
