const fs = require('fs')
const path = require('path')
const express = require('express')
const rootPath = require('app-root-path').path
const resolve = file => path.resolve(rootPath, file)
const config = require('config')

const isProd = process.env.NODE_ENV === 'production'
process.noDeprecation = true

const app = express()

let renderer
if (isProd) {
  // In production: create server renderer using server bundle and index HTML
  // template from real fs.
  // The server bundle is generated by vue-ssr-webpack-plugin.
  const bundle = require(resolve('dist/vue-ssr-bundle.json'))
  // src/index.template.html is processed by html-webpack-plugin to inject
  // build assets and output as dist/index.html.
  const template = fs.readFileSync(resolve('dist/index.html'), 'utf-8')
  renderer = createRenderer(bundle, template)
} else {
  // In development: setup the dev server with watch and hot-reload,
  // and create a new renderer on bundle / index template update.
  require(resolve('core/build/dev-server'))(app, (bundle, template) => {
    renderer = createRenderer(bundle, template)
  })
}

function createRenderer (bundle, template) {
  // https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
  return require('vue-server-renderer').createBundleRenderer(bundle, {
    template,
    cache: require('lru-cache')({
      max: 1000,
      maxAge: 1000 * 60 * 15
    })
  })
}

const serve = (path, cache, options) => express.static(resolve(path), Object.assign({
  maxAge: cache && isProd ? 60 * 60 * 24 * 30 : 0
}, options))

const themeRoot = require('../build/theme-path')

// Declare graphQl Server part
const bodyParser = require('body-parser')
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express')
const { makeExecutableSchema } = require('graphql-tools')
const resolvers = require('../graphql/resolvers')
const typeDefs = require('../graphql/schema')

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use('/graphql', graphqlExpress({ schema }))
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))
// End of Declare graphQl Server part

app.use('/dist', serve('dist', true))
app.use('/assets', serve(themeRoot + '/assets', true))
app.use('/assets', serve('core/assets', true))
app.use('/service-worker.js', serve('dist/service-worker.js', {
  setHeaders: {'Content-Type': 'text/javascript; charset=UTF-8'}
}))

app.use('/service-worker-ext.js', serve('dist/service-worker-ext.js', {
  setHeaders: {'Content-Type': 'text/javascript; charset=UTF-8'}
}))

app.get('*', (req, res) => {
  if (!res.get('Content-Type')) {
    res.append('Content-Type', 'text/html')
  }

  if (!renderer) {
    return res.end('<html lang="en">\n' +
        '    <head>\n' +
        '      <meta charset="utf-8">\n' +
        '      <title>Loading</title>\n' +
        '      <meta http-equiv="refresh" content="10">\n' +
        '    </head>\n' +
        '    <body>\n' +
        '      Vue Storefront: waiting for compilation... refresh in 30s :-) Thanks!\n' +
        '    </body>\n' +
        '  </html>')
  }

  const s = Date.now()

  const errorHandler = err => {
    if (err && err.code === 404) {
      // res.status(404).end('404 | Page Not Found')
      res.redirect('/page-not-found')
    } else {
      // Render Error Page or Redirect
      res.status(500).end('500 | Internal Server Error')
      console.error(`error during render : ${req.url}`)
      console.error(err)
    }
  }

  renderer.renderToStream({ url: req.url, storeCode: req.header('x-vs-store-code') ? req.header('x-vs-store-code') : process.env.STORE_CODE }) // TODO: pass the store code from the headers
    .on('error', errorHandler)
    .on('end', () => console.log(`whole request: ${Date.now() - s}ms`))
    .pipe(res)
})

const port = process.env.PORT || config.server.port
const host = process.env.HOST || config.server.host
app.listen(port, host, () => {
  console.log(`Vue Storefront Server started at http://${host}:${port}`)
})
