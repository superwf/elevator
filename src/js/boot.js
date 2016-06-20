const code = require('./index.es')
$(function() {
  const editor = window.editor
  editor.setCode(code)
  // run on nextTick
  setTimeout(() => {
    editor.trigger('apply_code')
  })

  // 按空格键开始或暂停
  $(document).on('keypress', ev => {
    if (ev.keyCode === 32) {
      ev.preventDefault()
      $('.startstop').trigger('click')
    }
  })
})
