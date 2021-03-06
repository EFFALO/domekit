#\ -E none
# The above line is processed by `rackup` for gem users.
# It is ignored if you start the server with `java -jar closure.jar`.
# Changes to this file always require a server restart.
require 'closure'

# Everything in the current folder will be served as root.
Closure.add_source '.', '/'

# Add some useful built-ins.
Closure.add_source :docs, '/docs'
Closure.add_source :externs

# Feel free to use your own compilers.
# Closure.config.compiler_jar = 'closure-compiler/compiler.jar'
# Closure.config.soy_js_jar = 'closure-templates/SoyToJsSrcCompiler.jar'

# Ruby users may need to be specific about which java to use.
# This is not used under JRuby or when running the .jar server.
# Closure.config.java = 'java'

if ENV['HEROKU']
  use Rack::Static, :urls => {"/" => 'index.html'}, :root => 'build'
  run Rack::URLMap.new({
    "/" => Rack::Directory.new('./build')
  })
else
  # The Closure middleware and a simple file server.
  use Closure::Middleware, 'index'
  run Rack::File.new '.'
end
