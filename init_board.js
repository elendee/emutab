import config from './config.js?v=22'
import WS from './WS.js?v=22'
import hal from './hal.js?v=22'
import fetch_wrap from './fetch_wrap.js?v=22'
import * as lib from './lib.js?v=22'
import ui from './ui.js?v=22'
import {
	Modal,
} from './Modal.js?v=22'
import {
	boards,
	scratch,
	priv, // private boards wrapper
	invites,// public boards wrapper
	line_place,
	line_total,
} from  './board_ui.js?v=22' 
// import pop_options_modal from './board_options.js?v=22'
import BROKER from './EventBroker.js?v=22'
import USER from './USER.js?v=22'




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


let initialized_boards = false // the main init bool









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
	build_tab(){
		this.tab = document.createElement('div')
		this.tab.classList.add('button')
		this.tab.title = 'click to set active: ' + this.name
		this.tab.innerHTML = this.name || this.uuid.substr(0,4)
		this.tab.setAttribute('data-uuid', this.uuid )
		this.tab.addEventListener('click', () => {
			BROKER.publish('BOARD_SET_ACTIVE', {
				uuid: this.uuid,
			})
		})
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
	if( board_data.fg_color ) scratch.style.color = board_data.fg_color
	if( board_data.bg_color ) scratch.style['background-color'] = board_data.bg_color
}

// const render_lines = () => {

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
		}, 3000 )

	}
	
	if( saving ) clearTimeout( saving )
	saving = setTimeout(()=>{
		// if( !get_active_board() ) return
		BROKER.publish('BOARD_SAVE')
		clearTimeout( saving )
		saving = false
	}, 3000)
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
scratch.addEventListener('click', () => {
	if( initialized_boards ) return
	hal('success', 'initializing...', 1000 )
	BROKER.publish('SOCKET_SEND', {
		type: 'ext_init_boards',
	})
	initialized_boards = true
	
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
const build_add_users = container => {
	/*
		add 'users who can edit' form for modal
	*/
	const wrapper = document.createElement('div')
	wrapper.classList.add('add-users')
	const input = document.createElement('input')
	input.placeholder = 'enter a user handle or email'
	container.appendChild( wrapper)
}

const build_edit_field = ( type, label, cb, start_value ) => {
	const wrapper = document.createElement('div')
	wrapper.classList.add('field-wrapper')
	const label_ele = document.createElement('label')
	label_ele.classList.add('field-label')
	label_ele.innerHTML = label
	const input = document.createElement('input')
	input.name = label // not used for database
	input.type = type
	if( type === 'checkbox'){
		input.checked = start_value
	}else{
		input.value = start_value
	}
	input.addEventListener('change', cb )
	wrapper.appendChild( label_ele )
	wrapper.appendChild( input )
	return wrapper
}

const build_user_icon = user => {
	const wrapper = document.createElement('div')
	wrapper.classList.add('user-icon')
	wrapper.innerHTML = `<span style='color: ${ user?.color || 'lightgrey' }'>${ user?.handle || '(invalid user name)' }</span>`
	return wrapper
}

const build_anchor_icon = anchor => {
	const wrapper = document.createElement('div')
	wrapper.classList.add('column', 'anchor')
	wrapper.title = 'created: ' + new Date( anchor._created ).toLocaleString() + '\nclick to preview'
	wrapper.innerHTML = '<img src="/resource/media/anchor.png">'
	wrapper.addEventListener('click', preview_anchor )
	wrapper.setAttribute('data-uuid', anchor.uuid )
	return wrapper
}























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

	console.log( 'set active', event )

	event = event || {}

	const { uuid, skip_state } = event

	// set target uuid; default to localStorage uuid
	let target_uuid = uuid
	if( !uuid ){
		console.log('setting active from localStorage') 
		target_uuid = localStorage.getItem('emu-active-tab')
	}

	// validate
	const board = BOARDS[ target_uuid ]
	const btn = boards.querySelector('.button[data-uuid="' + target_uuid + '"]')
	if( !btn || !board ){
		console.log(`invalid set_active target_uuid ${ target_uuid } uuid ${ uuid } ls ${ ls } `)
		return
	}
	// handle button
	for( const b of boards.querySelectorAll('.button')){
		b.classList.remove('active')
	}
	btn.classList.add('active')

	// fill content
	scratch.value = board.content || '' // lib.generate_content( 50 )

	// colors
	render_colors( board )

	// remember
	localStorage.setItem('emu-active-tab', target_uuid )

	// if( !skip_state ) window.history.pushState( {}, '', '/board/' + target_uuid );

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
		hal('success', 'board updated: ' + b.name, 4000 )
	}

}






const handle_attendance = event => {
	const { all_users } = event
	console.log( 'handle users', event )

}




const pop_options_modal = event => {
	/*
		edit all Board options
		board does not technically need to exist in BOARDS but it probably cant hurt
	*/

	const { board, allowed_users, online_users, anchors } = event

	console.log( 'modal: ', event )

	const modal = new Modal({
		type: 'board_options',
	})
	modal.make_columns()
	modal.ele.setAttribute('data-board-uuid', board.uuid )

	const header = document.createElement('h3')
	header.innerHTML = 'board options: ' + board.name
	modal.content.prepend( header )

	// online users
	const online_label = document.createElement('div')
	online_label.classList.add('field-label')
	online_label.innerHTML = 'online users:'
	const online = document.createElement('div')
	online.classList.add( 'online-users' )
	for( const user of online_users ){
		const u = build_user_icon( user )
		online.appendChild( u )
	}
	modal.right_panel.appendChild( online_label )
	modal.right_panel.appendChild( online )

	// permitted users
	const user_head = document.createElement('div')
	user_head.innerHTML = '<span class="field-label">users who can edit:</span>'
	modal.right_panel.appendChild( user_head )
	const user_list = document.createElement('div')
	user_list.classList.add('allowed-users')
	for( const user of ( allowed_users || [] ) ){
		user_list.appendChild( build_user_icon( user ))
	}
	modal.right_panel.appendChild( user_list )
	user_list.innerHTML = '(in development - boards are either public or private for now)'

	/* 
		finish later:
		build_add_users( modal.right_panel )
	*/

	// change name
	const edit_name = build_edit_field('text', 'name', ()=> {
		BROKER.publish('SOCKET_SEND', {
			type: 'board_set_option',
			uuid: board.uuid,
			option: 'name',
			state: edit_name.querySelector('input').value.trim(),
		})		
	}, board.name )
	modal.left_panel.appendChild( edit_name )

	// public / private
	const pubtoggle = build_edit_field('checkbox', 'is public', () => {

		const is_public = pubtoggle.querySelector('input').checked

		BROKER.publish('SOCKET_SEND', {
			type: 'board_set_option',
			uuid: board.uuid,
			option: 'is_public',
			state: is_public,
		})

	}, board.is_public )

	const expl = document.createElement('div')
	const url = `${ config.PUBLIC_URL }/board/${ board.uuid }`
	expl.innerHTML = `share this board: <br><input value="${ url }">` // .substr(1,6)
	expl.classList.add('board-share')
	const input = expl.querySelector('input')
	input.addEventListener('keyup', e => {
		input.value = url	
	})
	input.addEventListener('change', e => {
		input.value = url	
	})
	expl.onclick = () => {
		setTimeout(()  => {
			expl.querySelector('input').select()
		}, 100 )
	}
	pubtoggle.appendChild( expl )
	modal.left_panel.appendChild( pubtoggle )

	// show public setting on load
	reflect_public_url( pubtoggle, board )

	// colors
	const board_colors = document.createElement('div')
	board_colors.classList.add('board-colors')
	const fg_color = build_edit_field('color', 'foreground', () => {
		BROKER.publish('SOCKET_SEND', {
			type: 'board_set_option',
			uuid: board.uuid,
			option: 'fg_color',
			state: fg_color.querySelector('input').value,
		})
	})
	board_colors.appendChild( fg_color )
	fg_color.querySelector('input').value = board.fg_color 
	const bg_color = build_edit_field('color', 'background', () => {
		BROKER.publish('SOCKET_SEND', {
			type: 'board_set_option',
			uuid: board.uuid,
			option: 'bg_color',
			state: bg_color.querySelector('input').value,
		})
	})
	board_colors.appendChild( bg_color )
	bg_color.querySelector('input').value = board.bg_color 
	modal.left_panel.appendChild( board_colors )

	// anchors
	const anchor_wrap = document.createElement('div')
	anchor_wrap.classList.add('anchor-wrap')
	const anchor_label = document.createElement('div')
	anchor_label.classList.add('field-label', 'field-wrapper')
	anchor_label.innerHTML = 'anchors'
	anchor_wrap.appendChild( anchor_label )
	const anchor_icons = document.createElement('div')
	if( anchors ){
		for( const uuid in anchors ){
			anchor_icons.appendChild( build_anchor_icon( anchors[uuid] ) )
		}		
	}else{
		anchor_icons.innerHTML = '(none)'
	}
	anchor_wrap.appendChild( anchor_icons )
	modal.left_panel.appendChild( anchor_wrap )

	// append
	content.appendChild( modal.ele )

}


const reflect_public_url = ( share_ele, board ) => {
	// console.log('?', share_ele )
	const share = share_ele.querySelector('.board-share')
	share.style.display = board.is_public ? 'block' : 'none'
}

const reflect_value = ( key, wrapper, board ) => {
	const input = wrapper.querySelector('input[' + key + '="' + board[ key ] + '"]')
	if( input ) input.value = board[ key ]
}


const reflect_options = event => {

	const { board, allowed_users } = event

	// console.log( event )
	const active = get_active_board()

	const is_editing = document.querySelector('.modal[data-board-uuid="' + board?.uuid + '"]')

	if( is_editing ){

		// admin ripples
		hal('success', 'board options updated', 3000)
		// url
		const wrapper = document.querySelector('.modal .board-share').parentElement
		if( wrapper ){
			reflect_public_url( wrapper, board )
			reflect_value( 'name', wrapper, board )
		}else{
			console.log('missing public/private wrapper')
		}

	}else{
		// users who happen to be on the board when its edited
		// hal('standard', 'board options updated', 3000)

	}

	// board name
	const btn = boards.querySelector('.button[data-uuid="' + board.uuid + '"]')
	if( btn ) btn.innerText = board.name

	// board public
	if( BOARDS[ board.uuid ].is_public !== board.is_public ){
		hal('standard', board.name + ' is now ' + ( board.is_public ? 'public' : 'private' ) , 10 * 1000 )
	}

	// colors
	if( active === board.uuid ){
		render_colors( board )
	}

	if( Array.isArray( allowed_users ) ){
		// user list needs to be rendered separately probably
		console.log('awaiting allowed users', allowed_users )		
	}


}



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
BROKER.subscribe('BOARD_REFLECT', reflect_options )
BROKER.subscribe('BOARD_PONG_ANCHOR', pong_anchor )
BROKER.subscribe('BOARD_TOUCH', board_touch )
