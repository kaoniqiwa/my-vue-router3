# ts-node

`$ ts-node --esm install.ts`

package.json

```json
{
  "type": "module"
}
```

tsconfig.json

```json
{
  "module": "ESNext",
  "moduleResolution": "node"
}
```

install.ts

```ts
import Vue from 'vue';
```

1. 在查找 vue 包时，使用 node 依赖路径查找
   moduleResolution:node
2. 编辑结果为 esm 规范
   module:ESNext
3. node 运行 esm 代码
   type:module
4. `$ ts-node --esm install.ts`:编译 install.ts,编译结果为 esm 代码，结果给 node 运行
