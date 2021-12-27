#!/bin/bash

npm i |& tee install.log
clear
node.exe registerCommands.js |& tee -a bot.log
node.exe index.js |& tee -a bot.log
echo && read -s -p "Press ENTER to continue |> "
