# Domekit

Domekit is a library and application for generating geodesic solids using JavaScript and Canvas. It will be the basis of the [domekit.cc dome generator](http://domekit.cc/generator/).

# Usage

* domekit.erb and domekit_demo.js are our sample application, open that thang in a browser (see below)
* domekit.js is the Domekit library.
* domekit.cc/generator/index.html is the domekit.cc dome generator

You will need Closure Script to build this project. There is a Ruby
and a Java version of the Closure Script tool. Your choice.

**Ruby:**

    gem install closure
    rackup

**Java:**

Download closure.jar into the domekit project directory from <https://github.com/dturnbull/closure-script/downloads>

    java -jar closure.jar

Once you're up and running, browse to <http://localhost:9292/>

# Deploying

```bash
rake #builds a copy of the generator to the build directory
git commit -am "re-built generator"
git push heroku
```

# References

Reference geodesic dome generation algorithms: <http://www.antiprism.com/other/dome/index.html>

# Collaborators

* Michael Felix [@mfelix](https://github.com/mfelix)
* Andrew Kurtz [@ahk](https://github.com/ahk)
* Robby Kraft [@robbykraft](https://github.com/robbykraft)
* Ezra Spier [@ahhrrr](https://github.com/ahhrrr)
