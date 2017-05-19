docker -H "tcp://build.swarm.devfactory.com" build -t registry.devfactory.com/devfactory/jive-swing-poc:dev .
docker -H "tcp://build.swarm.devfactory.com" push registry.devfactory.com/devfactory/jive-swing-poc:dev
