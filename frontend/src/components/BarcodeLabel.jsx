import Barcode from 'react-barcode';

const BarcodeLabel = ({ labNo, sample, customerName, isExpress }) => (
  <div
    style={{
      border: '1px dashed #ccc',
      padding: 8,
      margin: 4,
      textAlign: 'center',
      background: isExpress ? '#fff1f0' : '#fff',
      width: 200,
    }}
  >
    {isExpress && (
      <div style={{ color: '#ff4d4f', fontWeight: 700, fontSize: 11 }}>URGENT</div>
    )}
    <Barcode value={labNo} width={1.5} height={40} fontSize={12} />
    <div style={{ fontSize: 11, marginTop: 4 }}>{sample}</div>
    <div style={{ fontSize: 10, color: '#666' }}>{customerName}</div>
  </div>
);

export default BarcodeLabel;
