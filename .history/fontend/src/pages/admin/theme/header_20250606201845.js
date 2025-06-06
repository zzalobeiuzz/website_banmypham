import React from 'react'

const Header = () => {
    return (
        <header class="bg-light py-3 border-bottom">
            <div class="container d-flex justify-content-between align-items-center">
            <a href="/" class="me-3">
            <img src='./assets/images/logo.png' />
          </a>
                <nav>
                    <a href="/" class="me-3">Home</a>
                    <a href="/about">About</a>
                </nav>
            </div>
        </header>

    )
}

export default Header