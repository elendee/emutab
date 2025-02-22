// import STATE from '../../STATE.js?v=40'
// import BROKER from '../../EventBroker.js?v=40'


class Modal {

	constructor( init ){
		// init.id
		init = init || {}
		if( !init.type ) debugger

		const ele = this.ele = document.createElement('div')
		this.ele.classList.add('modal')
		if( init.id ) this.ele.id = init.id

		const type = this.type = init.type
		this.ele.classList.add( type )
		this.ele.setAttribute('data-type', type )

		this.content = document.createElement('div')
		this.content.classList.add('modal-content')

		this.close = document.createElement('div')
		this.close.classList.add('modal-close', 'flex-wrapper')
		this.close.innerHTML = '&times;'
		this.close.addEventListener('click', () => {
			this.ele.remove()
			// BROKER.publish('MODAL_CLOSE', { type: init.type })
		})
		this.ele.appendChild( this.content )
		this.ele.appendChild( this.close )

	}



	make_columns(){

		this.left_panel = document.createElement('div')
		this.left_panel.classList.add('column', 'column-2', 'left-panel')

		this.right_panel = document.createElement('div')
		this.right_panel.classList.add('column', 'column-2', 'right-panel')

		this.content.appendChild( this.left_panel )
		this.content.appendChild( this.right_panel )

		this.ele.classList.add('has-columns')
		
	}


}








export {
	Modal,
	// ModalTrigger,
	// StatusBar,
}

