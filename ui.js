import config from './config.js?v=39'

// import GLOBAL from './GLOBAL.js?v=39'
// import hal from './hal.js?v=39'
import BROKER from './EventBroker.js?v=39'



let spinning = false



class Spinner{

	constructor( init ){
		init = init || {}
		this.ele = init.ele || document.createElement('div')
		this.ele.classList.add('spinner')
		this.img = init.img || document.createElement('img')
		this.img.src = this.img.src || init.src
		this.ele.appendChild( this.img )

		document.body.appendChild( this.ele )
	}

	show( ele ){
		if( ele ){
			ele.appendChild( this.ele )
			this.ele.style.position = 'absolute'
		}else{
			document.body.appendChild( this.ele )
			this.ele.style.position = 'fixed'
		}
		this.ele.style.display = 'flex'
		if( spinning ){
			clearTimeout(spinning)
			spinning = false
		}
		spinning = setTimeout(()=>{
			clearTimeout(spinning)
			spinning = false
		}, 10 * 1000)
	}
	hide(){
		this.ele.remove()
		// this.ele.style.display = 'none'
	}
}


const spinner = new Spinner({
	src: '/resource/media/spinner.gif'
})

if( config.EXPOSE ) window.spinner = spinner







const bind_button = element => {
	element.addEventListener('click', function(){
		BROKER.publish('SOUND_UI_NOISE')
	})
}

const buttons = document.getElementsByClassName('button')
for( let i = 0; i < buttons.length; i++ ){
	bind_button( buttons[i] )
}





// const toggle = document.getElementById('mobile-toggle')
// toggle.addEventListener('click', () => {
// 	const links = document.getElementById('links')
// 	links.classList.toggle('hidden')
// })
// const links = document.getElementById('links')
// if( window.innerWidth < 800 ){
// 	links.classList.add('hidden')
// }





export default {
	spinner,
	bind_button,
}


