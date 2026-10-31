interface Props {
  mensagem: string
  onTentar: () => void
}

/** Mensagem de erro de uma requisição com botão para tentar de novo. */
export default function ErroRetry({ mensagem, onTentar }: Props) {
  return (
    <div className="erro-retry" role="alert">
      <p>{mensagem}</p>
      <button type="button" className="botao botao--secundario" onClick={onTentar}>
        Tentar novamente
      </button>
    </div>
  )
}
