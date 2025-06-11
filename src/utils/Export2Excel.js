/* eslint-disable eqeqeq */
/* eslint-disable camelcase */
import { saveAs } from 'file-saver'
import XLSX from 'xlsx'

function datenum (v, date1904) {
  if (date1904) v += 1462
  const epoch = Date.parse(v)
  return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000)
}

function sheet_from_array_of_arrays (data, opts) {
  const ws = {}
  const range = { s: { c: 10000000, r: 10000000 }, e: { c: 0, r: 0 } }
  for (let R = 0; R != data.length; ++R) {
    for (let C = 0; C != data[R].length; ++C) {
      if (range.s.r > R) range.s.r = R
      if (range.s.c > C) range.s.c = C
      if (range.e.r < R) range.e.r = R
      if (range.e.c < C) range.e.c = C
      const cell = { v: data[R][C] }
      if (cell.v == null) continue
      const cell_ref = XLSX.utils.encode_cell({ c: C, r: R })

      if (typeof cell.v === 'number') cell.t = 'n'
      else if (typeof cell.v === 'boolean') cell.t = 'b'
      else if (cell.v instanceof Date) {
        cell.t = 'n'
        cell.z = XLSX.SSF._table[14]
        cell.v = datenum(cell.v)
      } else cell.t = 's'

      ws[cell_ref] = cell
    }
  }
  if (range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range)
  return ws
}

function Workbook () {
  if (!(this instanceof Workbook)) return new Workbook()
  this.SheetNames = []
  this.Sheets = {}
}

function s2ab (s) {
  const buf = new ArrayBuffer(s.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF
  return buf
}

export const export_json_to_excel = ({
  multiHeader = [],
  header,
  data,
  filename,
  merges = [],
  autoWidth = true,
  bookType = 'xlsx'
} = {}) => {
  // 设置文件名称
  filename = filename || 'excel-list'
  // 把数据解析为数组，并把表头添加到数组的头部
  data = [...data]
  data.unshift(header)
  // 解析多表头，把多表头的数据添加到数组头部（二维数组）
  for (let i = multiHeader.length - 1; i > -1; i--) {
    data.unshift(multiHeader[i])
  }
  // 设置Excel表工作簿（第一张表格）名称
  const ws_name = 'SheetJS'
  // 生成工作簿对象
  const wb = new Workbook()
  // 将data数组（json格式）转化为Excel数据格式
  const ws = sheet_from_array_of_arrays(data)
  // 合并单元格相关（['A1:A2','B1:D1','E1:E2]）
  if (merges.length > 0) {
    if (!ws['!merges']) ws['!merges'] = []
    merges.forEach(item => {
      ws['!merges'].push(XLSX.utils.decode_range(item))
    })
  }
  // 单元格宽度相关
  if (autoWidth) {
    // 设置worksheet每列的最大宽度
    const colWidth = data.map(row =>
      row.map((val) => {
        if (val == null) {
          return {
            wch: 10
          }
        } else if (val.toString().charCodeAt(0) > 255) {
          // 判断是否是中文
          return {
            wch: val.toString().length * 2
          }
        } else {
          return {
            wch: val.toString().length
          }
        }
      }))
    const result = colWidth[0]
    for (let i = 1; i < colWidth.length; i++) {
      for (let j = 0; j < colWidth[i].length; j++) {
        if (result[j].wch < colWidth[i][j].wch) {
          result[j].wch = colWidth[i][j].wch
        }
      }
    }
    ws['!cols'] = result
  }

  // 添加工作表（解析后的excel数据）到工作簿
  wb.SheetNames.push(ws_name)
  wb.Sheets[ws_name] = ws
  // 写入数据
  const wbout = XLSX.write(wb, {
    bookType: bookType,
    bookSST: false,
    type: 'binary'
  })
  // 下载数据
  saveAs(
    new Blob([s2ab(wbout)], {
      type: 'application/octet-stream'
    }),
    `${filename}.${bookType}`
  )
}
