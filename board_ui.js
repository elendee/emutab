import config from './config.js?v=22'
import BROKER from './EventBroker.js?v=22'
// import config from './config.js?v=22'
import hal from './hal.js?v=22'
import {
	is_emu_uuid,
	parse_slug,
	random_hex,
} from './lib.js?v=22'
import fetch_wrap from './fetch_wrap.js?v=22'
import USER from './USER.js?v=22'
import GLOBAL from './GLOBAL.js?v=22'
import { Modal } from './Modal.js?v=22'







// --------------------------------
// modals
// --------------------------------

const pop_options = () => {
	const active = get_active_board()
	if( !active ){
		hal('error', 'no active board', 3000)
		return
	}
	BROKER.publish('SOCKET_SEND', {
		type: 'ping_options',
		uuid: active,
		// localStorage.getItem('emu-active-tab')
	})
}

const pop_all_settings = () => {

	const modal = new Modal({
		type: 'all-settings',
	})
	const header = document.createElement('h3')
	header.innerHTML = 'all settings'
	modal.content.appendChild( header )

	const url = build_simple_display( 'connected to:', config.WS_URL )
	const user = build_simple_display( 'using account:', [ USER.handle, USER.email ] )

	modal.content.appendChild( header )
	modal.content.appendChild( url )
	modal.content.appendChild( user )

	document.body.appendChild( modal.ele )

}





// --------------------------------
// DOM builders
// --------------------------------

const build_choice = ( type, callback ) => {
	const wrapper = document.createElement('div')
	wrapper.classList.add('board-choice')
	// const header = document.createElement('h4')
	// header.innerHTML = type
	// wrapper.appendChild( header )
	const btn = document.createElement('div')
	btn.classList.add('button')
	btn.innerHTML = type
	wrapper.appendChild( btn )
	btn.addEventListener('click', callback )
	return wrapper
}

const build_simple_display = ( label, values ) => {
	const wrapper = document.createElement('div')
	wrapper.classList.add('simple-display')
	const label_ele = document.createElement('div')
	label_ele.classList.add('value-label')
	label_ele.innerHTML = label
	wrapper.appendChild( label_ele )
	const content = document.createElement('div')
	content.classList.add('simple-content')
	if( Array.isArray(values)){
		for( const value of values ){
			content.innerText += value + '\n'
		}
	}else{
		content.innerText = value
	}
	return wrapper

}




// --------------------------------
// lib
// --------------------------------

const join_board = ( value, modal ) => {

	const slug = parse_slug( value )

	if( !is_emu_uuid( slug ) ){
		hal('error', !slug ? 'need a value' : 'invalid value - must be ' + GLOBAL.SLUG_LENGTH + ' chars', 3000)
		return
	}
	BROKER.publish('SOCKET_SEND', {
		type: 'join_board',
		value: value,
	})
	modal.ele.querySelector('.modal-close')?.click()
}

const create_board = async() => {
	USER.awaiting_hash = random_hex( 4 )
	// console.log('adding...', USER.awaiting_hash )
	BROKER.publish('SOCKET_SEND', {
		type: 'add_board',
		hash: USER.awaiting_hash,
	})	
}

const get_active_board = window.get_active_board = () => {
	const btn = boards.querySelector('.button.active')
	if( !btn ) return false
	return btn.getAttribute('data-uuid')
}

const parse_emu_location = data => {
	if( location.href.match(/chrome-extension/)) return data
	if( data.match(/emu.oko.nyc/)) return 'emu.oko.nyc'
	return data
}
























// --------------------------------
// init sequence
// --------------------------------

// main content element
const scratch = document.createElement('textarea')
scratch.id = 'scratchpad'
content.appendChild( scratch )

// const lines = document.createElement('textarea')
// lines.id = 'lines'
// content.appendChild( lines )
// console.log('--show lines shim--')
// document.body.classList.add('show-lines')
const line_wrap = document.createElement('div')
line_wrap.classList.add('row')
line_wrap.id = 'line-wrap'
const line_place = document.createElement('div')
line_place.classList.add('column', 'column-2')
const line_total = document.createElement('div')
line_total.classList.add('column', 'column-2')
line_wrap.appendChild( line_place )
line_wrap.appendChild( line_total )
content.appendChild( line_wrap )

// sidebar element
const boards = document.createElement('div')
boards.id = 'boards'
content.appendChild( boards )

// private boards
const priv = document.createElement('div')
priv.title = 'private boards'
priv.id = 'private-boards'
priv.innerHTML = 'account'
boards.appendChild( priv )

// holds invited / public boards
const invites = document.createElement('div')
invites.title = 'public boards'
invites.id = 'invites'
invites.innerHTML = 'all'
// invites.classList.add('content')
boards.appendChild( invites )

// tooltip
const how = document.createElement('div')
how.id ='how'
how.innerHTML = `
<div id='question'>?</div>
<div id='hover'>
	<div id='id-address'>
		<div>connected to:</div>
		${ parse_emu_location( config.WS_URL ) }
	</div>
	<div id='id-credentials'>
		<div>signed in as:</div>
	</div>
	<p>Emu boards are plaintext.  They are private by default, but you can toggle them public and get a link from the settings to share with friends.</p>
	<p>Boards are saved and updated as you type.</p>
	<p>Logged users can save ${ GLOBAL.BOARDS.LOGGED_LIMIT } boards.</p>
	<p>Unlogged users' boards will be deleted after ${ GLOBAL.BOARDS.UNLOGGED_BOARD_HOURS } hours.</p>
</div>
`
content.appendChild( how )
// const all_settings = document.createElement('div')
// all_settings.id ='all-settings'
// all_settings.innerHTML = `<img src='/resource/media/gear.png'>`
// all_settings.addEventListener('click', pop_all_settings )
// content.appendChild( all_settings )

// options
const options = document.createElement('div')
options.id = 'options'
options.classList.add('main-button')
options.title = 'board settings (Esc to open/close)'
options.innerHTML = '<img src="/resource/media/gear.png">'
options.addEventListener('click', pop_options )
content.appendChild( options )

// anchors
const anchor = document.createElement('div')
anchor.id = 'anchor'
anchor.classList.add('main-button')
anchor.title = 'anchors are immutable saves.  click to create, then access them in the board settings'
anchor.innerHTML = '<img src="/resource/media/anchor.png">'
anchor.addEventListener('click', () => {
	BROKER.publish('SOCKET_SEND', {
		type: 'create_anchor',
		board_uuid: get_active_board(),
	})
})
content.appendChild( anchor )



const toggle = () => {
	content.classList.toggle('toggled')
}
const mobile_toggle = document.createElement('div')
mobile_toggle.innerHTML = '&#x1f354'// 'menu'
mobile_toggle.classList.add('button')
mobile_toggle.id = 'menu-toggle'
mobile_toggle.addEventListener('click', toggle )
content.appendChild( mobile_toggle )


const add_board = document.createElement('div')
add_board.id = 'add-board'
add_board.classList.add('main-button')
add_board.innerHTML = '+'
add_board.title = 'create board'
add_board.addEventListener('click', () => {

	const modal = new Modal({
		type: 'add_board',
	})

	const add = build_choice('create board', () => {
		create_board()
		modal.ele.querySelector('.modal-close')?.click()
	})

	const slug = document.createElement('input')
	slug.classList.add('input')
	slug.placeholder = 'full URL or code you want to join - either will work'

	const join = build_choice('join board', () => {
		const value = parse_slug( slug.value?.trim() )
		join_board( value, modal )
	})

	const header = document.createElement('h4')
	header.innerHTML = 'create or join a board'

	modal.content.appendChild( header )
	modal.content.appendChild( add )
	modal.content.appendChild( join )
	join.appendChild( slug )

	document.body.appendChild( modal.ele )

})
content.appendChild( add_board )

























export {
	scratch,
	boards,
	priv,
	invites,
	// public_nav,
	how,
	toggle,
	mobile_toggle,
	get_active_board,
	line_wrap,
	line_place,
	line_total,
	// m_save,
	// m_refresh,
}