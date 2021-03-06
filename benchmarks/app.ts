// Support config paths from the tsconfig.json file
// See: https://www.npmjs.com/package/tsconfig-paths
declare const window: any
declare const process: any
declare const global: any

// Ref: https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
const isNode = new Function('try {return process;}catch(e){ return false;}')

import megadata, { TypeDecorator } from 'megadata'
import MessageType from 'megadata/classes/MessageType'

export enum TypeIds {
  Binary,
  EmptyBinary,
  Json
}

export const Type: TypeDecorator<TypeIds> = megadata(module)

function getType() {
  let type: string | null = null

  if (isNode()) {
    type = process.argv[2]
  } else {
    type = window.type
  }

  return type || `Binary`
}

const type = getType()
const mod = require(`./types/${type}`)
const TypeClass = mod.default as typeof MessageType
const { alter } = mod

let running: boolean
let timer: NodeJS.Timer

export function run(): any {
  if (!running) {
    return
  }

  const start = Date.now()
  let end = 0
  let count = 0

  let instance = TypeClass.create()
  let buffer = instance.pack()
  instance.release()

  while (count < 1000000) {
    instance = MessageType.parse(buffer)
    alter(instance)
    buffer = instance.pack()
    instance.release()
    count += 1
  }

  end = Date.now()

  // tslint:disable:no-console
  console.log(`${type}: 1,000,000 in ${end - start} ms`)

  // Using setTimeout directly results in violation warnings
  // being printed in Chrome
  return new Promise((resolve) => timer = setTimeout(resolve, 500)).then(run)
}

function start() {
  console.log('starting benchmark')
  running = true
  run()
}

function stop() {
  clearTimeout(timer)
  running = false
  console.log('benchmark stopped')
}

if (isNode()) {
  global.start = start
  global.stop = stop
} else {
  window.start = start
  window.stop = stop
}

start()
