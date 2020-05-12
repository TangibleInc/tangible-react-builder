const path = require('path')
const fetch = require('node-fetch')
const fs = require('fs-extra')

module.exports = function handleExport(config = {}) {

  if (!process.env.APP_EXPORT || !config.routes) return

  // On next tick to ensure server is listening
  setTimeout(function() {
    exportRoutes(config.routes)
  }, 0)
}

async function exportRoutes(routes) {

  const port = process.env.PORT || 3000
  const dest = process.env.APP_PUBLIC_DIR
  const baseUrl = `http://localhost:${port}`

  const relativeDest = path.relative(process.cwd(), dest)

  console.log('Export from', baseUrl)

  const getRoute = (route) => new Promise((resolve, reject) => {
    fetch(route)
      .then(res => res.text())
      .then(resolve)
      .catch(reject)
  })

  for (const route of routes) {

    console.log(`Export ${route}`)

    const html = await getRoute(`${baseUrl}${route}`)
    const routeTargetDir = path.join(dest, route)
    const routeTargetFile = path.join(routeTargetDir, 'index.html')

    await fs.ensureDir(routeTargetDir)
    await fs.writeFile(routeTargetFile, html, 'utf8')
  }

  console.log('Exported to', relativeDest)

  process.exit()
}