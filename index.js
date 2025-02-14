'use strict'

const { exec } = require('child_process')
const { writeFile } = require('fs')
const tmp = require('tmp')
const x = require('throw-if-missing')

module.exports = ({ exe = '/mnt/c/Program Files (x86)/Cisco/Cisco AnyConnect Secure Mobility Client/vpncli.exe',
					server = x`server`, username = x`username`, password = x`password`, acceptCertificate, group }) => {

	return {
		connect: ()=>new Promise((resolve, reject) =>
			tmp.file({ prefix: 'vpn-', postfix: '.txt' }, (err, path, fd, cleanup) => {
				acceptCertificate = acceptCertificate ? acceptCertificate+'\n':''
				group = group ? group+'\n':''
				if(err) reject(err)
				else writeFile(path, `${acceptCertificate}${group}${username}\n${password}\n`, err => {
					if(err) reject(err)
					else exec(`"${exe}" connect ${server} -s < ${path}`, (err, stdout) => {
						cleanup()
						if(err) reject(err)
						else if(!stdout.trim().endsWith('state: Connected')) reject(new Error(stdout))
						else resolve()
					})
				})
			})
		),
		disconnect: ()=>new Promise((resolve, reject) =>
			exec(`"${exe}" disconnect`, (err, stdout) => {
				if(err) reject(err)
				else if(!stdout.trim().endsWith('state: Disconnected')) reject(new Error(stdout))
				else resolve()
			})
		),
		is_connected: ()=>new Promise((resolve, reject)=>
			exec(`"${exe}" state`, (err, stdout)=>{
				if(err) reject(err)
				else if(!stdout.includes('state: Connected')) resolve(false)
				else resolve(true)
			})
		)
	}
}
