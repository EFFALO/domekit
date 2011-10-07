# Inspired by https://github.com/dusty/multi-rack-app-app/blob/master/tasks/app.rake

BUILD_DIRECTORY = "build"
PORT = 3000

task :default => [:build]

desc "Build a copy of the domekit.cc generator into the build directory"
task :build => [:clean, "app:start", :pause, :copy_assets, :copy_app, "app:stop"] do
  puts "=> Build complete. Please commit the changes."
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
    sh "curl localhost:#{PORT}/domekit.cc/generator/generator.js?build > #{BUILD_DIRECTORY}/generator.js"
    sh "curl localhost:#{PORT}/domekit.cc/generator/index.html?build > #{BUILD_DIRECTORY}/index.html"
  rescue
    puts "Files failed to be copied. Do you have curl installed? Was the server running?"
  end
end

task :pause do
  puts "=> Waiting for server to start"
  sleep 3
end

task :clean do
  puts "=> Deleting build directory"
  rm_rf BUILD_DIRECTORY
end

namespace :app do
  desc "Start app server in background"
  task :start do
    puts "=> Starting server"
    sh "rackup -p #{PORT} -P rack.pid -D"
  end

  desc "Stop app server"
  task :stop do
    begin
      Process.kill("INT", File.read("rack.pid").to_i)
      puts "=> Server stopped"
    rescue
      puts "!! PID not found"
    end
  end

  desc 'Restart app server'
  task :restart => [:stop, :start]
end
