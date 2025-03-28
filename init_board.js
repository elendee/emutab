import config from './config.js?v=40'
import WS from './WS.js?v=40'
import hal from './hal.js?v=40'
// import fetch_wrap from './fetch_wrap.js?v=40'
import * as lib from './lib.js?v=40'
import ui from './ui.js?v=40'
// import {
// 	Modal,
// } from './Modal.js?v=40'
import {
	boards,
	scratch,
	priv, // private boards wrapper
	invites,// public boards wrapper
	line_place,
	line_total,
} from  './board_ui.js?v=40' 
import BROKER from './EventBroker.js?v=40'
import USER from './USER.js?v=40'
import GLOBAL from './GLOBAL.js?v=40'
import pop_options_modal from './board_settings.js?v=40'



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

	build_tab(){
		this.tab = document.createElement('div')
		this.tab.classList.add('tab')
		this.button = document.createElement('div')
		this.button.classList.add('button')
		this.tab.append( this.button )
		this.tab.title = 'click to set active: ' + this.name
		this.button.innerHTML = this.name || this.uuid.substr(0,4)
		this.tab.setAttribute('data-uuid', this.uuid )
		this.button.setAttribute('data-uuid', this.uuid )
		setTimeout(() => {
			this.tab.append( this.build_arrow(1) )
			this.tab.append( this.build_arrow(0) )			
		}, 200 )
		this.button.addEventListener('click', click_tab )

		// eye icon
		const is_priv = this.is_priv = document.createElement('div')
		is_priv.classList.add('tab-toggle', 'private')
		// is_priv.innerHTML = '<img src="/resource/media/eye.svg">'
		const img_priv = this.img_priv = document.createElement('img')
		img_priv.src = '/resource/media/eye.png'
		is_priv.append( img_priv )
		is_priv.addEventListener('click', set_public )
		this.tab.prepend( is_priv )

		// lock icon
		const is_lock = this.is_lock = document.createElement('div')
		is_lock.classList.add('tab-toggle', 'public')
		// is_lock.innerHTML = '<img src="/resource/media/lock.png">'
		const img_lock = this.img_lock = document.createElement('img')
		img_lock.src = '/resource/media/pencil.png'
		is_lock.append( img_lock )
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
		wrapper.innerHTML = ( dir ? '&uarr;' : '&darr;' )
		wrapper.setAttribute('data-dir', dir )
		wrapper.classList.add('dir-arrow', ( dir ? 'up' : 'down') )
		// wrapper.addEventListener('click', move_tab )
		wrapper.addEventListener('mousedown', start_drag )
		return wrapper
	}

}


// main button clicks
const click_tab = e => {

	const btn = e.target
	const uuid = btn.getAttribute('data-uuid')

	if( btn.classList.contains('dir-arrow')) return console.log('(is arrow)')
	if( saving ){
		clearTimeout( saving )
		saving = false
		BROKER.publish('BOARD_SAVE')
	}
		// return hal('error', 'wait for save to complete..', 750 )
	BROKER.publish('BOARD_SET_ACTIVE', {
		uuid: uuid,
	})

}


// dragging
const dragger = document.createElement('div')
dragger.id ='dragger'
boards.append( dragger )
let draggerY = 0

let dragged_ele

const start_drag = e => {
	const tab = e.target.parentElement
	dragged_ele = tab
	document.body.addEventListener('mousemove', drag_tab )
	document.body.addEventListener('mouseup', end_drag )
	dragger.style.display = 'inline-block'
}
const drag_tab = e => {
	draggerY = e.clientY
	const hovered = get_tab( draggerY )
	if( hovered ){
		dragger.style.top = hovered.getBoundingClientRect().top
	}else{
		dragger.style.top = draggerY + 'px'
	}
}
const end_drag = e => {
	document.body.removeEventListener('mousemove', drag_tab )
	place_tab( dragged_ele )
	dragger.style.display = 'none'

	setTimeout(() => { // idk what it is about DOM operations...
		BROKER.publish('SOCKET_SEND', {
			type: 'save_index',
			index: build_index(),
		})		
	}, 100 )

	document.body.removeEventListener('mouseup', end_drag )

}

const place_tab = ele => {
	if( !ele?.classList.contains('tab')) return console.error('no dragged tab found')

	const hovered = get_tab( draggerY )
	if( hovered ){
		ele.parentElement.insertBefore( ele, hovered )
		setTimeout(() => {
			hovered.querySelector('.button').addEventListener('click', click_tab )
		}, 100 )
	}else{
		console.log('no tab found')
	}
}

const get_tab = posY => {
	let bounds
	for( const tab of boards.querySelectorAll('.tab') ){
		bounds = tab.getBoundingClientRect()
		if( draggerY > bounds.top && draggerY < bounds.top + bounds.height ){
			return tab
		}
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
			// console.log(`testing ${ board_data.name }`)
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

// const move_tab = e => {
// 	const tab = e.target.parentElement
// 	const dir = e.target.getAttribute('data-dir')

// 	const shift = Number( dir ) ? 'down': 'up'

// 	lib.shift_element( shift, tab, '.tab', true )

// 	setTimeout(() => { // idk what it is about DOM operations...
// 		BROKER.publish('SOCKET_SEND', {
// 			type: 'save_index',
// 			index: build_index(),
// 		})		
// 	}, 100 )
// }

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


window.addEventListener('keyup', e => {
	if( e.keyCode === 27 ){
		const editor = document.querySelector('.modal.board_options')
		if( editor ){
			editor.querySelector('.modal-close').click()
		}else{
			// document.getElementById('options').click()
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
let initialized_boards = false // the main init bool


let init_loop

scratch.addEventListener('click', (e) => {

	update_line(e)

	if( init_option_panel ) init_option_panel.remove()

	if( init_loop || initialized_boards ) return

	hal('success', 'pinging boards...', 1000 )

	BROKER.publish('SOCKET_SEND', {
		type: 'EXT_init_boards',
	})

	init_loop = setInterval(() => {

		if( initialized_boards ){
			clearInterval( init_loop )
			return init_loop = false
		}

		hal('success', 'pinging boards...', 1000 )

		BROKER.publish('SOCKET_SEND', {
			type: 'EXT_init_boards',
		})

	}, 1000 )
	
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

	const { 
		uuid, 
		skip_state, 
		is_local_storage 
	} = event

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
			console.warn(`invalid set-active target-uuid`, {
				uuid,
				btn: !!btn,
				board: !!board,
			})
			if( is_local_storage ){
				delete localStorage[ 'emu-active-tab']
			}
			// throw new Error('fromw whence')
			return
		}		
		btn.classList.add('active')

		// boom, the content
		if( !board.CONTENT ){
			// fetch_wrap()
			BROKER.publish('SOCKET_SEND', {
				type: 'touch_content',
				uuid,
			})

		}else{

			scratch.value = board.CONTENT 

		}

		scratch.focus()

		render_colors( board )

		localStorage.setItem('emu-active-tab', uuid )


	}

	// if( !skip_state ) window.history.pushState( {}, '', '/board/' + ( uuid || '' ) )

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

	const { 
		board, 
		user_uuid 
	} = event

	// console.log( 'handle board: ', event )

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
			priv.append( b.tab )
		}else{
			invites.append( b.tab )
		}
	}else{ // update existing board
		if( typeof board._content === 'string' ){
			// console.warn('should be deprecated board content inside handle-board.  Switch content updates to a discrete event')
			b.CONTENT = board._content

			// if( get_active_board() == board.uuid ){
			// 	scratch.value = board._content
			// }

		}else{
			// 
		}
	}		

	// hydrate board from response
	for( const key in board ){
		if( key === 'content' ){
			console.warn('no more content in handle-board')
			continue
		}
		b[ key ] = board[ key ]
	}

	// render board if active
	if( board?.uuid && get_active_board() === board.uuid ){

		const selection_index = [scratch.selectionStart, scratch.selectionEnd]

		const selection_content = get_selection( scratch )

		scratch.value = b._content || ''

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
					priv.append( ele )
				}
			}
		}
		for( const ele of suspended_priv ){
			if( !ele.parentElement ) priv.append( ele )
		}

		// all
		const suspended_all = invites.querySelectorAll('.tab')
		for( const btn of suspended_all ) btn.remove()
		for( const uuid of sorted.all ){
			for( const ele of suspended_all ){
				if( ele.getAttribute('data-uuid') === uuid ){
					invites.append( ele )
					// debugger
				}
			}
		}
		for( const ele of suspended_all ){
			if( !ele.parentElement ) invites.append( ele )
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
	preview.append( expl )
	const area = document.createElement('textarea')
	area.value = anchor.content
	area.disabled = true
	preview.append( area )

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
	preview.append( set )
	const cancel = document.createElement('div')
	cancel.classList.add('button')
	cancel.innerHTML = 'cancel'
	cancel.addEventListener('click', () => {
		preview.remove()
	})
	preview.append( cancel )
	content.append( preview )
	// hal('standard', '(coming soon)<br><pre>' + anchor.content + '</pre>', 2000 )
	// console.log( anchor )
}

const init_complete = event => {
	// const {  } = event

	set_active({ 
		uuid: localStorage.getItem('emu-active-tab'),
		is_local_storage: true,
	})

	initialized_boards = true
	// initializing_boards = false

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
	// console.log('propagating: ', user )
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






let init_option_panel

if( window.innerWidth > 800 ){

	if( !config.LOCALHOSTS ){
		console.warn('no localhosts declared in env for quick-starts')
	}

	init_option_panel = lib.b('div', 'options-panel')

	// custom
	const clients = lib.b('div', 'custom-links')
	const c = lib.b('a')
	c.innerText =  'localhost/clients'
	c.href = config.CLIENT_LINK || 'http://localhost/clients'
	clients.append( c )
	init_option_panel.append( clients )

	init_option_panel.append( lib.b('div', false, 'divider'))

	// localhost apps
	const node_ports = lib.b('div', 'node-ports')
	const ports = {}
	for( const key in config.LOCALHOSTS || {} ){
		const port = config.LOCALHOSTS[key]
		if( !ports[ port ] ) ports[ port ] = []
		ports[ port ].push( key )
	}	
	for( const port in ports ){
		const apps = ports[ port ]
		const listing = lib.b('div', false, 'port-listing')
		for( const app of apps ){
			const wrap = lib.b('div', false, 'app-row')
			const link = lib.b('a')
			link.href = 'http://localhost:' + port
			link.innerText = `${port}:${app}`
			wrap.append( link )
			listing.append( wrap )
		}
		node_ports.append( listing )
	}
	init_option_panel.append( node_ports )

	init_option_panel.append( lib.b('div', false, 'divider'))


	// live sites
	const live_apps = lib.b('div', 'live-apps')
	// const apps = {}
	for( const key in config.LIVE_APPS || {} ){
		const app_link = config.LIVE_APPS[key]
		// if( !apps[ key ] ) apps[ key ] = []
		const wrap = lib.b('div', false, 'app-row-live')
		const link = lib.b('a')
		link.href = app_link
		link.innerText = `${key}`
		wrap.append( link )
		live_apps.append( wrap )
	}
	init_option_panel.append( live_apps )

	document.body.append( init_option_panel )
}









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
