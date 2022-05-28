import BROKER from './EventBroker.js?v=22'
// import config from './config.js?v=22'
import hal from './hal.js?v=22'
import {
	random_hex,
} from './lib.js?v=22'
import fetch_wrap from './fetch_wrap.js?v=22'
import USER from './USER.js?v=22'









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


const get_active_board = window.get_active_board = () => {
	const btn = boards.querySelector('.button.active')
	if( !btn ) return false
	return btn.getAttribute('data-uuid')
}








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
	<p>Emu boards are plaintext.  They are private by default, but you can toggle them public and get a link from the settings to share with friends.</p>
	<p>Boards are saved and updated as you type.</p>
	<p>Users can make 3 boards.</p>
	<p>Unlogged users' boards will be deleted after 24 hours.</p>
</div>
`
content.appendChild( how )

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

// save indicator
const last_scratch = document.createElement('div')
last_scratch.id = 'last-scratch'
content.appendChild( last_scratch )

const toggle = () => {
	content.classList.toggle('toggled')
}
const mobile_toggle = document.createElement('div')
mobile_toggle.innerHTML = '&#x1f354'// 'menu'
mobile_toggle.classList.add('button')
mobile_toggle.id = 'menu-toggle'
mobile_toggle.addEventListener('click', toggle )
content.appendChild( mobile_toggle )



// const m_save = document.createElement('div')
// m_save.innerHTML = 'save'
// m_save.classList.add('button')
// m_save.id = 'mobile-save'
// m_save.addEventListener('click', () => {
// 	BROKER.publish('BOARD_SAVE')
// })
// content.appendChild( m_save )


// const m_refresh = document.createElement('div')
// m_refresh.innerHTML = 'refresh'
// m_refresh.classList.add('button')
// m_refresh.id = 'mobile-refresh'
// m_refresh.addEventListener('click', () => {
// 	BROKER.publish('BOARD_REFRESH')
// })
// content.appendChild( m_refresh )



const add_board = document.createElement('div')
add_board.id = 'add-board'
add_board.classList.add('main-button')
add_board.innerHTML = '+'
add_board.title = 'create board'
add_board.addEventListener('click', () => {
	USER.awaiting_hash = random_hex( 4 )
	// console.log('adding...', USER.awaiting_hash )
	BROKER.publish('SOCKET_SEND', {
		type: 'add_board',
		hash: USER.awaiting_hash,
	})
})
content.appendChild( add_board )









export {
	last_scratch,
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