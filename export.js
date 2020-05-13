const path = require('path')
const fetch = require('node-fetch')
const fs = require('fs-extra')

module.exports = function handleExport(config = {}) {

  if (process.env.APP_EXPORT!=='1' || !config.routes) return

  const {
    dest, // process.env.APP_PUBLIC_DIR in the app
    routes
  } = config

  if (!dest) {
    console.error('Export destination must be passed in "dest" property')
    process.exit()
    return
  }

  const port = process.env.PORT || 3000
  const baseUrl = `http://localhost:${port}`

  // After next tick to ensure server is listening
  setTimeout(function() {

    console.log('Export from', baseUrl)

    exportRoutes({
      port,
      dest,
      baseUrl,
      routes
    }).then(() => {
      console.log('Exported to', path.relative(process.cwd(), dest))
      process.exit()
    }).catch(e => {
      console.error('Export failed', e)
      process.exit()
    })
  }, 0)
}

const getRoute = (route) => new Promise((resolve, reject) => {
  fetch(route)
    .then(res => res.text())
    .then(resolve)
    .catch(reject)
})

async function exportRoutes({
  dest,
  baseUrl,
  routes
}) {

  for (const {
    path: route,
    routes: childRoutes
  } of routes) {

    console.log(`Export ${route}`)

    const html = await getRoute(`${baseUrl}${route}`)
    const routeTargetDir = path.join(dest, route)
    const routeTargetFile = path.join(routeTargetDir, 'index.html')

    await fs.ensureDir(routeTargetDir)
    await fs.writeFile(routeTargetFile, html, 'utf8')

    if (!childRoutes) continue

    await exportRoutes({
      dest: `${dest}${route}`,
      baseUrl: `${baseUrl}${route}`,
      routes: childRoutes
    })
  }
}