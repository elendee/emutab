# okotab
new tab todo list chrome extension

## how to manually install an extension:
- open Chrome extensions (`chrome://extensions/`), make sure Dev mode is on
- Put this repo in the folder you use for your Chrome extensions (this can be any folder)
- click Load Unpacked
- Extension should now appear, and be enabled - if not, toggle it on

## setup

- unlike the web version, you must have an `https://emu.oko.nyc` account to use the extension
- create a `config.js` file in the extension folder with your account login
- sample follows.  Use the exact `WS_URL` as given.  The `EMUTAB` fields must match your account.
```
export default {

	WS_URL: 'wss://emu.oko.nyc/board/ws:9021',

	EMUTAB: {
		EMAIL: [your emu account email here],
		PASSWORD: [your emu account password here],
	}

}

```
