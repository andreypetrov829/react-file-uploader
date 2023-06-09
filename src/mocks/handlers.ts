import { rest } from 'msw';
import { v4 as uuid4 } from "uuid";
import { saveAs } from 'file-saver';

export const handlers = [
  rest.get('/api/getUrl', (req, res, ctx) => {
    return res(ctx.json({ uuid: uuid4(), url: "/api/upload" }))
  }),
  rest.post('/api/upload/:uuid', (req: any, res, ctx) => {
    const file = req.body.file;
    // saveAs(file);
    // return res(ctx.status(500), ctx.json({ data: "File uploaded successfully" }))
    return res(ctx.json({ data: "File uploaded successfully" }))
    // const doc = JSON.parse(localStorage.getItem('cat_data'));
    // return res(ctx.json(doc));
  }),

  rest.post('/api/notify', (req, res, ctx) => {
    // const jsonData  = req.body;
    // localStorage.setItem('cat_data', JSON.stringify(jsonData));
    // return res(ctx.status(200));
  }),
];
