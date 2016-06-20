const code = require('./index.es')
$(function() {
  const editor = window.editor
  editor.setCode(code)
  // run on nextTick
  setTimeout(() => {
    editor.trigger('apply_code')
  })
})
