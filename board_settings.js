import hal from './hal.js?v=40'
import { Modal } from './Modal.js?v=40'
import config from './config.js?v=40'
import BROKER from './EventBroker.js?v=40'







// --------------------------
// builders
// --------------------------

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










// --------------------------
// client callbacks
// --------------------------

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


const pop_options_modal = event => {
	/*
		edit all Board options
		board does not technically need to exist in BOARDS but it probably cant hurt
	*/

	const { 
		board, 
		allowed_users, 
		online_users, 
		anchors,
		is_owner,
	} = event

	console.log( 'modal: ', event )

	const modal = new Modal({
		type: 'board_options',
	})
	modal.make_columns()
	modal.ele.setAttribute('data-board-uuid', board.uuid )

	const header = document.createElement('h3')
	header.innerHTML = 'board options: ' + board.name
	modal.content.prepend( header )





	// -------------
	// right column
	// -------------

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






	// -------------
	// left column
	// -------------

	// ---- name
	const edit_name = build_edit_field('text', 'name', ()=> {
		BROKER.publish('SOCKET_SEND', {
			type: 'board_set_option',
			uuid: board.uuid,
			option: 'name',
			state: edit_name.querySelector('input').value.trim(),
		})		
	}, board.name )
	modal.left_panel.appendChild( edit_name )

	// ---- board URL
	const expl = document.createElement('div')
	const origin = config.WS_URL.match(/accounts.oko.nyc/) ? 'https://accounts.oko.nyc' : '[unknown host]'
	const url = `${ origin }/board/${ board.uuid }`
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
	modal.left_panel.appendChild( expl )

	// ---- colors
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
	const tab_color = build_edit_field('color', 'tab', () => {
		BROKER.publish('SOCKET_SEND', {
			type: 'board_set_option',
			uuid: board.uuid,
			option: 'tab_color',
			state: tab_color.querySelector('input').value,
		})
	})
	board_colors.appendChild( tab_color )
	tab_color.querySelector('input').value = board.tab_color 
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

	// delete
	const del = document.createElement('div')
	del.classList.add('button', 'delete')
	del.innerHTML = is_owner ? 'delete' : 'leave'
	del.addEventListener('click', () => {
		const msg = ( is_owner ? 'Delete ' : 'Leave ' ) + board.name + '?'
		if( !confirm( msg ) ) return
		BROKER.publish('SOCKET_SEND', {
			type: 'remove_board',
			subtype: is_owner ? 'delete' : 'leave',
			uuid: board.uuid,
		})
	})
	modal.left_panel.appendChild( del )

	// append
	content.appendChild( modal.ele )

}



export default pop_options_modal