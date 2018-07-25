import * as React from 'react';

export const LoadingHTML = <div>
  <img style={{width: '230px', display: 'block', margin: 'auto', marginTop: '40px'}} className="logo"
       src="/logo.png"/>
  <div style={{textAlign: 'center', marginTop: '40px'}}>
    <div style={{display: 'inline-block'}}>
      <i className="fas fa-sync fa-spin fa-2x"/>
    </div>
  </div>
</div>;
