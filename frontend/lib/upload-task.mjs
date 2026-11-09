// Upload and server acceptance are distinct phases of one multipart request.
export function uploadTask(body, user, onUploaded, XHR = XMLHttpRequest) {
  return new Promise((resolve, reject) => {
    const xhr = new XHR();
    xhr.open("POST", "/api/tasks");
    xhr.setRequestHeader("X-User", user);
    xhr.upload.onload = onUploaded;
    xhr.onerror = () => reject(new Error("网络异常，请检查连接后重试"));
    xhr.onabort = () => reject(new Error("上传已中断，请重试"));
    xhr.onload = () => {
      let result;
      try {
        result = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error(`请求失败 (${xhr.status})`));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(result);
      else reject(new Error(result.message || `请求失败 (${xhr.status})`));
    };
    xhr.send(body);
  });
}
