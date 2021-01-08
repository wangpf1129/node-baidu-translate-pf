import * as https from 'https';
import * as querystring from 'querystring';
import md5 = require('md5');
import {appId, appSecret} from './private';

type errorMap = {
  [key: string]: string;
}
const errorMap: errorMap = {
  52001: '请求超时',
  52002: '系统错误',
  52003: '未授权用户',
  54000: '必填参数为空',
  54001: '签名错误',
  54003: '访问频率受限',
  54004: '账户余额不足',
  54005: '长query请求频繁',
  58000: '客户端IP非法',
  58001: '译文语言方向不支持',
  58002: '服务当前已关闭',
  90107: '认证未通过或未生效',
  unknown: '服务器繁忙'
};
export const translate = function (word:string) {

  const salt: string = Math.random().toString();
  const sign: string = md5(appId + word + salt + appSecret);
  let from, to;
  if (/[a-zA-z]/.test(word[0])) {
    // 英译中
    from = 'en';
    to = 'zh';
  } else {
    // 中译英
    from = 'zh';
    to = 'en';
  }
  const query: string = querystring.stringify(
          {
            q: word, from, to, appid: appId, salt, sign,
          });
  // q=banana&from=en&to=zh&appid=20210108000666401&salt=1435660288&sign=fef0f134c2beadf79f28fc35b169d064
  const options = {
    hostname: 'api.fanyi.baidu.com',
    port: 443,
    path: '/api/trans/vip/translate?' + query,
    method: 'GET'
  };

  const request = https.request(options, (response) => {
    const chunks: Buffer[] = [];
    response.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    response.on('end', () => {
      type baiduResult = {
        form: string;
        to: string;
        trans_result: [{
          src: string;
          dst: string;
        }]
        error_code?: string;
        error_msg?: string;
      }
      const object: baiduResult = JSON.parse(Buffer.concat(chunks).toString());
      if (object.error_code) {
        console.log(errorMap[object.error_code] || object.error_msg);
        process.exit(2);
      } else {
        object.trans_result.map(obj => {
          console.log(obj.dst);
        });
        process.exit(0);
      }
    });
  });

  request.on('error', (e) => {
    console.error(e);
  });
  request.end();
};