function DaydreamEmbed() {
  return (
    <>
      <iframe
        src="https://daydream.live"
        width="100%"
        height="800px"
        style={{ border: 'none' }}
        allow="camera; microphone"
      />
    </>
  );
}

export default DaydreamEmbed;
