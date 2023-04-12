import React from 'react';
import EnhancedSearch from 'enhancedocs-search';

import 'enhancedocs-search/dist/style.css';

export default function SearchBarWrapper(props) {
  return (
    <EnhancedSearch
      config={{
        enhancedSearch: {
          projectId: "<replace with project id>",
          accessToken: "<replace with access Token>"
        }
      }}
      theme={{
        primaryColor: "#25c2a0"
      }}
      {...props}
    />
  );
}
