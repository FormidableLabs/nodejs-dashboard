"use strict";

module.exports = [
  [
    {
      position: {
        grow: 3
      },
      views: [
        {
          name: "stdout"
        },
        {
          name: "stderr"
        }
      ]
    },
    {
      views: [
        {
          name: "cpu",
          limit: 30
        },
        {
          name: "eventLoop",
          limit: 30
        },
        {
          name: "memory",
          position: {
            size: 15
          }
        }
      ]
    }
  ],
  [
    {
      position: {
        grow: 3
      },
      views: [
        {
          name: "stdouterr"
        }
      ]
    },
    {
      views: [
        {
          name: "cpu",
          limit: 30
        },
        {
          name: "eventLoop",
          limit: 30
        },
        {
          name: "memory",
          position: {
            size: 15
          }
        }
      ]
    }
  ],
  [
    {
      views: [
        {
          name: "cpu",
          limit: 30
        },
        {
          name: "eventLoop",
          limit: 30
        }
      ]
    }
  ],
  [
    {
      views: [
        {
          name: "stdout"
        },
        {
          name: "stderr"
        }
      ]
    }
  ],
  [
    {
      views: [
        {
          name: "stdouterr"
        }
      ]
    }
  ]
];
