dev environment for elevator game
=================

for [elevator game](http://play.elevatorsaga.com/)

# start dev
```bash
  npm install
  git submodule update --init --recursive
  npm start
```

edit public/app.js
add in line 124, to export editor to global
```js
window.editor = editor;
```

run 
```bash
  npm start
```

and then open 127.0.0.1:8000

you can use space to start or stop the play
edit src/js/index.es to play
