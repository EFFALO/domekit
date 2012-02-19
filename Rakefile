# Inspired by https://github.com/dusty/multi-rack-app-app/blob/master/tasks/app.rake

BUILD_DIRECTORY = "build"
APP_PORT = 3000
BUILD_PORT = APP_PORT.succ

def start_server(name, port)
  puts "=> Starting #{name} server"
  sh "rackup -p #{port} -P #{name}.pid -D"
end

def stop_server(name)
  begin
    Process.kill("INT", File.read("#{name}.pid").to_i)
    puts "=> Stopped #{name} server"
  rescue
    puts "!! PID not found"
  end
end

task :default => ["build:make"]

namespace :build do
  desc "Build a copy of the domekit.cc generator into the build directory"
  task :make => [:clean, :start, :pause, :copy_assets, :copy_app, :stop] do
    puts "=> Build complete. Please commit the changes."
  end

  task :start do
    start_server(:build, BUILD_PORT)
  end

  task :stop do
    stop_server(:build)
  end

  task :copy_assets do
    puts "=> Copying static assets to build directory"
    files = Dir.glob('domekit.cc/generator/*')
    mkdir BUILD_DIRECTORY
    cp_r files, "build"
  end

  task :copy_app do
    puts "=> Building app HTML and Javascript"
    begin
      sh "curl localhost:#{BUILD_PORT}/domekit.cc/generator/generator.js?build > #{BUILD_DIRECTORY}/generator.js"
      sh "curl localhost:#{BUILD_PORT}/domekit.cc/generator/index.html?build > #{BUILD_DIRECTORY}/index.html"
    rescue
      puts "Files failed to be copied. Do you have curl installed? Was the server running?"
    end
  end

  task :pause do
    puts "=> Waiting for build server to start"
    sleep 3
  end

  task :clean do
    puts "=> Deleting build directory"
    rm_rf BUILD_DIRECTORY
  end
end

namespace :app do
  desc "Start app server in background"
  task :start do
    start_server(:app, APP_PORT)
  end

  desc "Stop app server"
  task :stop do
    stop_server(:app)
  end

  desc 'Restart app server'
  task :restart => [:stop, :start]
end
