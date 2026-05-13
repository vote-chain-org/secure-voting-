package com.votechain.backend.security;

import com.votechain.backend.model.User;
import com.votechain.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtUtil.isValid(token)) {
                String email = jwtUtil.extractEmail(token);
                // Look up the user's role and set it as authority
                Optional<User> userOpt = userRepository.findByEmail(email);
                List<SimpleGrantedAuthority> authorities = userOpt
                        .map(u -> List.of(new SimpleGrantedAuthority(u.getRole())))
                        .orElse(List.of());
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(email, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        chain.doFilter(request, response);
    }
}