import ui from './ui.js?v=40'

export default async( url, method, body, no_spinner ) => {
	/*
		always expects json !
	*/

	if( !no_spinner ) ui.spinner.show()

	let res, r 

	if( method.match(/post/i) ){

		res = await fetch( url, {
			method: 'post',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify( body )
		})

	}else{

		res = await fetch( url )

	}

	if( !no_spinner )  ui.spinner.hide()

	r = await res.json()

	return r 

}

